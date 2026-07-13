package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

type Vaga struct {
	ID        int     `json:"id"`
	Titulo    string  `json:"titulo"`
	Descricao string  `json:"descricao"`
	Empresa   string  `json:"empresa"`
	Tipo      string  `json:"tipo"`
	Bairro    string  `json:"bairro"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func main() {

	connStr := "user=postgres password=root dbname=CirculaSSA sslmode=disable"

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Erro ao abrir banco de dados: ", err)
	}

	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatal("O banco de dados nao respondeu: ", err)
	}
	fmt.Println("Conectado ao PostgreSQL")

	r := gin.Default()

	r.Use(cors.Default())

	api := r.Group("/api")
	{
		api.GET("/vaga", func(c *gin.Context) {

			lasStr := c.Query("lat")
			lonStr := c.Query("lon")
			raioStr := c.Query("raio")

			var rows *sql.Rows
			var err error

			if lasStr != "" && lonStr != "" {
				lat, _ := strconv.ParseFloat(lasStr, 64)
				lon, _ := strconv.ParseFloat(lonStr, 64)

				raio, _ := strconv.ParseFloat(raioStr, 64)
				if raio == 0 {
					raio = 5000
				}

				query := `
						SELECT id, titulo, descricao, empresa, tipo, bairro, latitude, longitude
						FROM vagas
						WHERE ST_DWithin(
							geom::geography,
							ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
							$3
						)`
				rows, err = db.Query(query, lon, lat, raio)

			} else {
				rows, err = db.Query("SELECT id, titulo, descricao, empresa, tipo, bairro, latitude, longitude FROM vagas")
			}

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao buscar vagas"})
				return
			}
			defer rows.Close()

			var vagas []Vaga
			for rows.Next() {
				var v Vaga
				if err := rows.Scan(&v.ID, &v.Titulo, &v.Descricao, &v.Empresa, &v.Tipo, &v.Bairro, &v.Latitude, &v.Longitude); err == nil {
					vagas = append(vagas, v)
				}
			}

			if len(vagas) == 0 {
				c.JSON(http.StatusNotFound, gin.H{"erro": "Nenhuma vaga encontrada nesta região."})
				return
			}
			c.JSON(http.StatusOK, vagas)
		})
		api.POST("/vaga", func(c *gin.Context) {
			var novaVaga Vaga

			if err := c.ShouldBindJSON(&novaVaga); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"erro": "Formato de JSON inválido", "detalhes": err.Error()})
				return
			}

			if novaVaga.Titulo == "" || novaVaga.Latitude == 0 || novaVaga.Longitude == 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"erro":     "Dados incompletos",
					"detalhes": "Os campos 'titulo', 'latitude' e 'longitude' são obrigatórios."})
				return
			}

			sqlStatement := `
				INSERT INTO vagas (titulo, descricao, empresa, tipo, bairro, latitude, longitude, geom)
				VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($7, $6), 4326))
				RETURNING id
			`

			err := db.QueryRow(sqlStatement,
				novaVaga.Titulo, novaVaga.Descricao, novaVaga.Empresa,
				novaVaga.Tipo, novaVaga.Bairro, novaVaga.Latitude, novaVaga.Longitude,
			).Scan(&novaVaga.ID)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao salvar no banco", "detalhes": err.Error()})
				return
			}

			c.JSON(http.StatusCreated, novaVaga)

		})

		api.DELETE("/vaga/:id", func(c *gin.Context) {
			idStr := c.Param("id")
			id, err := strconv.Atoi(idStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"erro": "ID invalido"})
				return
			}
			sqlStatement := `DELETE FROM vagas WHERE id = $1`
			res, err := db.Exec(sqlStatement, id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao excluir vaga do banco de dados"})
				return
			}

			count, err := res.RowsAffected()
			if err != nil || count == 0 {
				c.JSON(http.StatusNotFound, gin.H{"erro": "Vaga nao encontrada"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"mensagem": "Vaga excluida com sucesso"})
		})

	}
	r.Run(":8080")

}
