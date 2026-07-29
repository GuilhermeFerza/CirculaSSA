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

	empresaFiltro := c.Query("empresa")

	var rows *sql.Rows
	var err error

	if empresaFiltro != "" {
		query := `SELECT id, titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato, parceria_academica FROM vagas WHERE empresa = $1 LIMIT 150`
		rows, err = vc.DB.Query(query, empresaFiltro)
	} else if lasStr != "" && lonStr != "" {
		lat, _ := strconv.ParseFloat(lasStr, 64)
		lon, _ := strconv.ParseFloat(lonStr, 64)

		raio, _ := strconv.ParseFloat(raioStr, 64)
		if raio == 0 {
			raio = 5000
		}

		query := `
			SELECT id, titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato, parceria_academica
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
		rows, err = vc.DB.Query("SELECT id, titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato, parceria_academica FROM vagas LIMIT 150")
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
		if err := rows.Scan(&v.ID, &v.Titulo, &v.Descricao, &v.Empresa, &v.Tipo, &v.Bairro, &v.Latitude, &v.Longitude, &v.LinkContato, &v.Parceria); err == nil {
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
				INSERT INTO vagas (titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato, parceria_academica, geom, user_id)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ST_SetSRID(ST_MakePoint($7, $6), 4326), (SELECT id FROM users WHERE email = $10))
				RETURNING id
			`

	err := vc.DB.QueryRow(sqlStatement,
		novaVaga.Titulo, novaVaga.Descricao, novaVaga.Empresa,
		novaVaga.Tipo, novaVaga.Bairro, novaVaga.Latitude, novaVaga.Longitude, novaVaga.LinkContato, novaVaga.Parceria, emailToken,
	).Scan(&novaVaga.ID)

	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao salvar no banco", "detalhes": err.Error()})
		return
	}

	var candidatosAlvo []models.User

	queryAlertas := `
		SELECT id, email, lat, lon, raio_alerta 
		FROM users 
		WHERE recebe_alerta = true 
		AND ST_DWithin(
			ST_MakePoint(lon, lat)::geography, 
			ST_MakePoint($1, $2)::geography, 
			raio_alerta * 1000
		)
	`

	rows, err := vc.DB.Query(queryAlertas, novaVaga.Longitude, novaVaga.Latitude)

	if err != nil {
		log.Printf("[ALERTA/ERROR] Erro ao buscar candidatos na região: %v", err)
	} else {
		defer rows.Close()

		for rows.Next() {
			var candidato models.User

			err := rows.Scan(
				&candidato.ID,
				&candidato.Email,
				&candidato.Lat,
				&candidato.Lon,
				&candidato.RaioAlerta,
			)

			if err != nil {
				log.Printf("[ALERTA/ERROR] Erro ao ler dados do candidato: %v", err)
				continue
			}
			candidatosAlvo = append(candidatosAlvo, candidato)
		}
	}

	log.Printf("[ALERTA] %d candidatos encontrados no raio da vaga!", len(candidatosAlvo))

	for _, candidato := range candidatosAlvo {
		sqlNotificao := `
			INSERT INTO notificacoes (user_id, vaga_id, mensagem)
			VALUES ($1, $2, $3)

		`
		mensagem := "Uma nova vaga de " + novaVaga.Titulo + " abriu pertinho de você!"

		_, err := vc.DB.Exec(sqlNotificao, candidato.ID, novaVaga.ID, mensagem)
		if err != nil {
			log.Printf("[NOTIFICACAO/ERROR] Falha ao criar notificação para o user %d: %v", candidato.ID, err)
		}
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
				SET titulo = $1, descricao = $2, empresa = $3, tipo = $4, bairro = $5, latitude = $6, longitude = $7, link_contato = $8, parceria_academica = $9, geom = ST_SetSRID(ST_MakePoint($7, $6), 4326)
				WHERE id = $10 AND user_id = (SELECT id FROM users WHERE email = $11)
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
		vagaAtualizada.Parceria,
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
				SELECT id, titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato, parceria_academica
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
		if err := rows.Scan(&v.ID, &v.Titulo, &v.Descricao, &v.Empresa, &v.Tipo, &v.Bairro, &v.Latitude, &v.Longitude, &v.LinkContato, &v.Parceria); err == nil {
			minhasVagas = append(minhasVagas, v)
		}
	}
	if minhasVagas == nil {
		minhasVagas = []models.Vaga{}
	}
	c.JSON(http.StatusOK, minhasVagas)
}
