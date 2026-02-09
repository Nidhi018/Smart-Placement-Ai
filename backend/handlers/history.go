package handlers

import (
	"backend/database"
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetHistory(c *gin.Context) {
	var history []models.ResumeAnalysis

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Fetch last 50 records for THIS user, newest first
	result := database.DB.Where("user_id = ?", userID).Order("created_at desc").Limit(50).Find(&history)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": history})
}
