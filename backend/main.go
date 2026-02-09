package main

import (
	"backend/database"
	"backend/handlers"
	"backend/middleware"
	"backend/storage"
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	database.ConnectDatabase()
	database.InitRedis()
	storage.InitMinio()
	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Create uploads directory for temporary processing
	os.MkdirAll("./uploads", 0755)

	// Proxy to MinIO
	// Protected Routes
	protected := r.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/uploads/:filename", handlers.GetResume)
		protected.POST("/upload", handlers.UploadResume)
		protected.GET("/history", handlers.GetHistory)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "OK"})
	})

	fmt.Println("Server starting on :8080")
	r.Run(":8080")
}
