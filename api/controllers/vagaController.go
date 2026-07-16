package controllers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/GuilhermeFerza/CirculaSSA/models"
	"github.com/gin-gonic/gin"
)

type VagaController struct {
	DB *sql.DB
}

func (vc *VagaController) GetVagas(c *gin.Context) {
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
						)
						LIMIT 150	
						`
		rows, err = vc.DB.Query(query, lon, lat, raio)

	} else {
		rows, err = vc.DB.Query("SELECT id, titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato FROM vagas LIMIT 150")
	}

	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao buscar vagas"})
		return
	}
	defer rows.Close()

	var vagas []models.Vaga
	for rows.Next() {
		var v models.Vaga
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

func (vc *VagaController) PostVagas(c *gin.Context) {
	emailToken, _ := c.Get("userEmail")

	var novaVaga models.Vaga

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
				INSERT INTO vagas (titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato, geom, user_id)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_MakePoint($7, $6), 4326), (SELECT id FROM users WHERE email = $9))
				RETURNING id
			`

	err := vc.DB.QueryRow(sqlStatement,
		novaVaga.Titulo, novaVaga.Descricao, novaVaga.Empresa,
		novaVaga.Tipo, novaVaga.Bairro, novaVaga.Latitude, novaVaga.Longitude, novaVaga.LinkContato, emailToken,
	).Scan(&novaVaga.ID)

	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao salvar no banco", "detalhes": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, novaVaga)
}

func (vc *VagaController) PutVagas(c *gin.Context) {
	emailToken, _ := c.Get("userEmail")

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "ID invalido"})
		return
	}

	var vagaAtualizada models.Vaga
	if err := c.ShouldBindJSON(&vagaAtualizada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "Formato de JSON inválido", "detalhes": err.Error()})
		return
	}
	if vagaAtualizada.Titulo == "" || vagaAtualizada.Latitude == 0 || vagaAtualizada.Longitude == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "Dados Incompletos"})
		return
	}

	sqlStatement := `
				UPDATE vagas
				SET titulo = $1, descricao =$2, empresa = $3, tipo = $4, bairro = $5, latitude = $6, longitude = $7, link_contato = $8, geom = ST_SetSRID(ST_MakePoint($7, $6), 4326)
				WHERE id = $9 AND user_id = (SELECT id FROM users WHERE email = $10)

			`
	res, err := vc.DB.Exec(sqlStatement,
		vagaAtualizada.Titulo,
		vagaAtualizada.Descricao,
		vagaAtualizada.Empresa,
		vagaAtualizada.Tipo,
		vagaAtualizada.Bairro,
		vagaAtualizada.Latitude,
		vagaAtualizada.Longitude,
		vagaAtualizada.LinkContato,
		id,
		emailToken,
	)
	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Vaga nao encontrada"})
		return
	}

	count, err := res.RowsAffected()
	if err != nil || count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"erro": "Vaga nao encontrada"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"mensagem": "Vaga atualizada com sucesso"})
}

func (vc *VagaController) DeleteVagas(c *gin.Context) {
	emailToken, _ := c.Get("userEmail")

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "ID invalido"})
		return
	}

	sqlDeleteSalvas := `
		DELETE FROM vagas_salvas
		WHERE vaga_id = $1
		AND EXISTS(
			SELECT 1 FROM vagas
			WHERE id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)
		)
	`
	_, err = vc.DB.Exec(sqlDeleteSalvas, id, emailToken)
	if err != nil {
		log.Printf("[SECURITY/ERROR] Falha ao limpar vagas salvas: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro interno ao processar exclusão"})
		return
	}

	sqlStatement := `
				DELETE FROM vagas 
				WHERE id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)
			`
	res, err := vc.DB.Exec(sqlStatement, id, emailToken)
	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao excluir vaga do banco de dados"})
		return
	}

	count, err := res.RowsAffected()
	if err != nil || count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"erro": "Vaga nao encontrada"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"mensagem": "Vaga excluida com sucesso"})
}

func (vc *VagaController) GetMinhasVagas(c *gin.Context) {
	emailToken, _ := c.Get("userEmail")

	query := `
				SELECT id, titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato
				FROM vagas
				WHERE user_id = (SELECT id FROM users WHERE email = $1)
			`
	rows, err := vc.DB.Query(query, emailToken)
	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao buscar suas vagas"})
		return
	}
	defer rows.Close()

	var minhasVagas []models.Vaga
	for rows.Next() {
		var v models.Vaga
		if err := rows.Scan(&v.ID, &v.Titulo, &v.Descricao, &v.Empresa, &v.Tipo, &v.Bairro, &v.Latitude, &v.Longitude, &v.LinkContato); err == nil {
			minhasVagas = append(minhasVagas, v)
		}
	}
	if minhasVagas == nil {
		minhasVagas = []models.Vaga{}
	}
	c.JSON(http.StatusOK, minhasVagas)
}
