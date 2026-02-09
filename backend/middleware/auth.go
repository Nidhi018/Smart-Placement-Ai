package middleware

import (
	"backend/database"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// GoogleTokenInfo represents the basic fields we need
type GoogleTokenInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"` // string "true" or boolean
	Aud           string `json:"aud"`
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		var idToken string

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				idToken = parts[1]
			}
		}

		// Fallback to query parameter (for file downloads/images)
		if idToken == "" {
			idToken = c.Query("token")
		}

		if idToken == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization token missing"})
			return
		}

		// Check Redis Cache first
		ctx := context.Background() // Or use c.Request.Context()
		redisKey := "session:" + idToken

		val, err := database.RedisClient.Get(ctx, redisKey).Result()
		if err == nil && val != "" {
			// Cache Hit!
			var cachedInfo GoogleTokenInfo
			if err := json.Unmarshal([]byte(val), &cachedInfo); err == nil {
				// Successfully loaded from cache
				c.Set("user_id", cachedInfo.Sub)
				c.Set("user_email", cachedInfo.Email)
				c.Next()
				return
			}
		}

		// Cache Miss - Verify with Google
		resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Failed to verify token"})
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google Token"})
			return
		}

		var tokenInfo GoogleTokenInfo
		if err := json.NewDecoder(resp.Body).Decode(&tokenInfo); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse token info"})
			return
		}

		// Cache the valid token info in Redis
		// Expiration: 1 hour (Google tokens usually last 1 hour)
		jsonData, _ := json.Marshal(tokenInfo)
		err = database.RedisClient.Set(ctx, redisKey, jsonData, 1*time.Hour).Err()
		if err != nil {
			fmt.Printf("Error caching session to Redis: %v\n", err)
		}

		// Store UserID in context
		c.Set("user_id", tokenInfo.Sub)
		c.Set("user_email", tokenInfo.Email)

		c.Next()
	}
}
