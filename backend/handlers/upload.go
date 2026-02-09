package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"

	"backend/database"
	"backend/models"
	"backend/storage"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
)

const DEFAULT_AI_SERVICE_URL = "http://ai-service:5000"

func getAIServiceURL() string {
	url := os.Getenv("AI_SERVICE_URL")
	if url == "" {
		return DEFAULT_AI_SERVICE_URL
	}
	return url
}

func GetResume(c *gin.Context) {
	filename := c.Param("filename")

	object, err := storage.GetFileStream(filename)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}
	defer object.Close()

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", filename))

	if _, err := io.Copy(c.Writer, object); err != nil {
		fmt.Println("Error streaming file:", err)
	}
}

func UploadResume(c *gin.Context) {
	file, err := c.FormFile("resume")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// 1. Save File to Disk (Temporary)
	uploadPath := fmt.Sprintf("./uploads/%s", file.Filename)
	if err := c.SaveUploadedFile(file, uploadPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file: " + err.Error()})
		return
	}
	defer os.Remove(uploadPath) // Clean up local file

	// 2. Extract Text
	content, err := readPdf(uploadPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse PDF: " + err.Error()})
		return
	}

	// 3. Upload to MinIO
	_, err = storage.UploadFile(file.Filename, uploadPath, "application/pdf")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload to object storage: " + err.Error()})
		return
	}

	// Check if content is empty
	if strings.TrimSpace(content) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not extract text from PDF. Please ensure it is a text-based PDF, not an image."})
		return
	}

	// Call AI Service
	analysisResult, err := callAIService(content)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "AI Service error: " + err.Error()})
		return
	}

	// Determine Candidate Name (AI vs Fallback)
	var aiName string
	// analysisResult["ai_analysis"] is where the insights are
	if aiAnalysis, ok := analysisResult["ai_analysis"].(map[string]interface{}); ok {
		aiName = getString(aiAnalysis["candidate_name"])
	}

	finalName := aiName
	if aiName == "Unknown" || aiName == "Unknown Candidate" || strings.TrimSpace(aiName) == "" {
		// Fallback to filename without extension
		finalName = strings.TrimSuffix(file.Filename, ".pdf")
	}

	// Save to Database
	userID, exists := c.Get("user_id")
	fmt.Printf("[DEBUG] Uploading Resume. UserID from context: %v (Exists: %v)\n", userID, exists)

	resumeRecord := models.ResumeAnalysis{
		UserID:               getString(userID),
		CandidateName:        finalName,
		OriginalFilename:     file.Filename,
		Profession:           getString(analysisResult["summary"]), // Or explicit profession field if available
		PlacementProbability: getFloat(analysisResult["placement_probability"]),
		Verdict:              getString(analysisResult["ai_analysis"].(map[string]interface{})["verdict"]),
		MatchPercentage:      getInt(analysisResult["placement_probability"]), // map placement_prob to match_pct
		ContentRating:        getInt(analysisResult["ai_analysis"].(map[string]interface{})["content_rating"]),
		FilePath:             "/uploads/" + file.Filename,
		AIAnalysisData:       datatypes.JSON(jsonToBytes(analysisResult)),
	}

	database.DB.Create(&resumeRecord)

	c.JSON(http.StatusOK, gin.H{
		"message": "Analysis Complete",
		"data":    analysisResult,
		"id":      resumeRecord.ID,
	})
}

// Helpers for safe type extraction
func getString(v interface{}) string {
	if s, ok := v.(string); ok {
		return s
	}
	return "Unknown"
}

func getFloat(v interface{}) float64 {
	if f, ok := v.(float64); ok {
		return f
	}
	if i, ok := v.(int); ok {
		return float64(i)
	}
	return 0.0
}

func getInt(v interface{}) int {
	if i, ok := v.(int); ok {
		return i
	}
	if f, ok := v.(float64); ok {
		return int(f)
	}
	return 0
}

func jsonToBytes(v interface{}) []byte {
	b, _ := json.Marshal(v)
	return b
}

func readPdf(filePath string) (string, error) {
	// Use pdftotext (Poppler) for high-quality extraction
	// -layout preserves physical layout which is good for resumes
	cmd := exec.Command("pdftotext", "-layout", filePath, "-")
	var out bytes.Buffer
	cmd.Stdout = &out

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("pdftotext failed: %v", err)
	}

	return out.String(), nil
}

func callAIService(text string) (map[string]interface{}, error) {
	payload := map[string]string{"resume_text": text}
	jsonData, _ := json.Marshal(payload)

	resp, err := http.Post(getAIServiceURL()+"/analyze", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI Service returned status: %d", resp.StatusCode)
	}

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	return result, err
}
