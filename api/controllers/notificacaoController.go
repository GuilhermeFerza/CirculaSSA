package controllers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/GuilhermeFerza/CirculaSSA/models"
	"github.com/gin-gonic/gin"
)

type NotificacaoController struct {
	DB *sql.DB
}

func (nc *NotificacaoController) GetNotif(c *gin.Context) {
	emailToken, existe := c.Get("userEmail")
	if !existe {
		c.JSON(http.StatusUnauthorized, gin.H{"erro": "Usuário não identificado"})
		return
	}

	query := `
		SELECT id, vaga_id, mensagem, lida, criado_em
		FROM notificacoes
		WHERE user_id = (SELECT id FROM users WHERE email = $1)
		ORDER BY criado_em DESC
	`

	rows, err := nc.DB.Query(query, emailToken)
	if err != nil {
		log.Printf("[DB/ERROR] Falha ao buscar notificações: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro ao buscar notificações"})
		return
	}
	defer rows.Close()

	var notificacoes []models.Notificacao
	for rows.Next() {
		var n models.Notificacao
		if err := rows.Scan(&n.ID, &n.VagaID, &n.Mensagem, &n.Lida, &n.CriadoEm); err == nil {
			notificacoes = append(notificacoes, n)
		} else {
			log.Printf("[DB/ERROR] Erro ao escanear notificação: %v", err)
		}
	}
	if notificacoes == nil {
		notificacoes = []models.Notificacao{}
	}
	c.JSON(http.StatusOK, notificacoes)
}

func (nc *NotificacaoController) MarcarComoLida(c *gin.Context) {
	emailToken, existe := c.Get("userEmail")
	if !existe {
		c.JSON(http.StatusUnauthorized, gin.H{"erro": "Usuário não identificado"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "ID inválido"})
		return
	}

	query := `UPDATE notificacoes SET lida = true WHERE id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)`
	res, err := nc.DB.Exec(query, id, emailToken)

	if err != nil {
		log.Printf("[DB/ERROR] Falha ao atualizar notificação: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro ao atualizar notificação"})
		return
	}

	count, err := res.RowsAffected()
	if err != nil || count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"erro": "Notificação não encontrada"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"mensagem": "Notificação marcada como lida"})
}
