package database

import (
	"backend/models"
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable TimeZone=Asia/Shanghai",
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DB"),
	)

	// Default to localhost if envs missing (local dev)
	if os.Getenv("POSTGRES_HOST") == "" {
		dsn = "host=localhost user=user password=password dbname=placement_db port=5432 sslmode=disable"
	}

	// Retry connection loop (to wait for Postgres container)
	var database *gorm.DB
	var err error

	for i := 0; i < 15; i++ {
		database, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		log.Printf("Database not ready (attempt %d/15)... retrying in 2s\n", i+1)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		log.Fatal("Failed to connect to database after multiple attempts: ", err)
	}

	log.Println("Database connected successfully!")

	// Auto Migrate the schema
	err = database.AutoMigrate(&models.ResumeAnalysis{})
	if err != nil {
		log.Printf("Warning: AutoMigrate failed: %v", err)
	}

	DB = database
}
