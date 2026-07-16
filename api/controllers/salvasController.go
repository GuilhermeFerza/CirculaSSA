package controllers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/GuilhermeFerza/CirculaSSA/models"
	"github.com/gin-gonic/gin"
)

type SalvasController struct {
	DB *sql.DB
}

func (sc *SalvasController) GetSalvas(c *gin.Context) {
	emailToken, _ := c.Get("userEmail")

	query := `
				SELECT v.id, v.titulo, v.descricao, v.empresa, v.tipo, v.bairro, v.latitude, v.longitude, v.link_contato
				FROM vagas v
				INNER JOIN vagas_salvas vs ON v.id = vs.vaga_id
				INNER JOIN users u ON u.id = vs.user_id
				WHERE u.email = $1
			`
	rows, err := sc.DB.Query(query, emailToken)
	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao buscar vagas salvas"})
		return
	}
	defer rows.Close()

	var vagasSalvas []models.Vaga
	for rows.Next() {
		var v models.Vaga
		if err := rows.Scan(&v.ID, &v.Titulo, &v.Descricao, &v.Empresa, &v.Tipo, &v.Bairro, &v.Latitude, &v.Longitude, &v.LinkContato); err == nil {
			vagasSalvas = append(vagasSalvas, v)
		}
	}

	if vagasSalvas == nil {
		vagasSalvas = []models.Vaga{}
	}
	c.JSON(http.StatusOK, vagasSalvas)
}

func (sc *SalvasController) PostSalvas(c *gin.Context) {
	emailToken, _ := c.Get("userEmail")

	var req struct {
		VagaID int `json:"vaga_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "ID da vaga invalido"})
		return
	}

	sqlStatement := `
				INSERT INTO vagas_salvas (user_id, vaga_id)
				VALUES ((SELECT id FROM users WHERE email = $1), $2)
			`
	_, err := sc.DB.Exec(sqlStatement, emailToken, req.VagaID)

	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			c.JSON(http.StatusConflict, gin.H{"erro": "Vaga ja foi salva anteriormente"})
			return
		}
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro ao salvar vaga no banco"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"mensagem": "Vaga salva com sucesso"})

}

func (sc *SalvasController) DeleteSalvas(c *gin.Context) {
	emailToken, _ := c.Get("userEmail")
	vagaIDStr := c.Param("id")
	vagaID, err := strconv.Atoi(vagaIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "ID inválido"})
		return
	}

	sqlStatement := `
				DELETE FROM vagas_salvas
				WHERE user_id = (SELECT id FROM users WHERE email = $1) AND vaga_id = $2
			`
	_, err = sc.DB.Exec(sqlStatement, emailToken, vagaID)
	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro ao remover vaga"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"mensagem": "Vaga removida dos favoritos"})

}
