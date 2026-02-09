package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var minioClient *minio.Client

func InitMinio() {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_SECRET_KEY")
	useSSL := os.Getenv("MINIO_USE_SSL") == "true"

	if endpoint == "" {
		endpoint = "localhost:9000"
	}
	if accessKey == "" {
		accessKey = "minioadmin"
	}
	if secretKey == "" {
		secretKey = "minioadmin"
	}

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})

	if err != nil {
		log.Fatalf("Failed to initialize MinIO client: %v", err)
	}

	minioClient = client
	log.Println("MinIO client initialized successfully")
}

func UploadFile(filename, filepath, contentType string) (string, error) {
	bucketName := os.Getenv("MINIO_BUCKET_NAME")
	if bucketName == "" {
		bucketName = "resumes"
	}

	ctx := context.Background()

	// Upload the file
	_, err := minioClient.FPutObject(ctx, bucketName, filename, filepath, minio.PutObjectOptions{
		ContentType: contentType,
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload file to MinIO: %v", err)
	}

	return fmt.Sprintf("/%s/%s", bucketName, filename), nil
}

func GetFileStream(filename string) (io.ReadCloser, error) {
	bucketName := os.Getenv("MINIO_BUCKET_NAME")
	if bucketName == "" {
		bucketName = "resumes"
	}

	ctx := context.Background()

	object, err := minioClient.GetObject(ctx, bucketName, filename, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get file from MinIO: %v", err)
	}

	return object, nil
}
