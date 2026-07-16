package controllers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetVagas(c *gin.Context) {
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
						SELECT id, titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato
						FROM vagas
						WHERE ST_DWithin(
							geom::geography,
							ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
							$3
						)`
		rows, err = db.Query(query, lon, lat, raio)

	} else {
		rows, err = db.Query("SELECT id, titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato FROM vagas")
	}

	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao buscar vagas"})
		return
	}
	defer rows.Close()

	var vagas []Vaga
	for rows.Next() {
		var v Vaga
		if err := rows.Scan(&v.ID, &v.Titulo, &v.Descricao, &v.Empresa, &v.Tipo, &v.Bairro, &v.Latitude, &v.Longitude, &v.LinkContato); err == nil {
			vagas = append(vagas, v)
		}
	}

	if len(vagas) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"erro": "Nenhuma vaga encontrada nesta região."})
		return
	}
	c.JSON(http.StatusOK, vagas)
}
