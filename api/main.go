package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {

	r := gin.Default()

	api := r.Group("/api")
	{
		api.GET("/vaga", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"vaga 1": "Cajazeiras",
				"vaga 2": "Brotas",
			})
		})
	}
	r.Run(":8080")

}
