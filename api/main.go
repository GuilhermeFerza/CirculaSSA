package main

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Vaga struct {
	ID        int     `json:"id"`
	Titulo    string  `json:"titulo"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func main() {

	r := gin.Default()

	r.Use(cors.Default())

	api := r.Group("/api")
	{
		api.GET("/vaga", func(c *gin.Context) {
			vagas := []Vaga{
				{ID: 1, Titulo: "Estágio em TI - Brotas", Latitude: -12.9866, Longitude: -38.4900},
				{ID: 2, Titulo: "Atendente de Padaria - Cajazeiras", Latitude: -12.8906, Longitude: -38.4144},
				{ID: 3, Titulo: "Jovem Aprendiz - Ribeira", Latitude: -12.9099, Longitude: -38.4965},
			}
			c.JSON(http.StatusOK, vagas)
		})
	}
	r.Run(":8080")

}
