package controllers

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/GuilhermeFerza/CirculaSSA/utils"
	"github.com/gin-gonic/gin"
)

type ResetCode struct {
	Code      string
	ExpiresAt time.Time
}

type ForgotPasswordController struct {
	DB       *sql.DB
	Codes    map[string]*ResetCode
	CodesMux sync.RWMutex
}

func NewForgotPasswordController(db *sql.DB) *ForgotPasswordController {
	fpc := &ForgotPasswordController{
		DB:    db,
		Codes: make(map[string]*ResetCode),
	}
	go fpc.limparCodigosExpirados()
	return fpc
}

func (fpc *ForgotPasswordController) limparCodigosExpirados() {
	for {
		time.Sleep(time.Minute)
		fpc.CodesMux.Lock()
		for email, code := range fpc.Codes {
			if time.Now().After(code.ExpiresAt) {
				delete(fpc.Codes, email)
			}
		}
		fpc.CodesMux.Unlock()
	}
}

func gerarCodigo() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

func (fpc *ForgotPasswordController) ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "Formato JSON invalido"})
		return
	}

	var existe int
	err := fpc.DB.QueryRow("SELECT 1 FROM users WHERE email = $1", req.Email).Scan(&existe)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"mensagem": "Se o email estiver cadastrado, voce recebera um codigo"})
		return
	}

	codigo := gerarCodigo()

	fpc.CodesMux.Lock()
	fpc.Codes[req.Email] = &ResetCode{
		Code:      codigo,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	fpc.CodesMux.Unlock()

	log.Printf("[FORGOT-PASSWORD] Codigo gerado para %s: %s", req.Email, codigo)

	c.JSON(http.StatusOK, gin.H{"mensagem": "Codigo enviado com sucesso", "code": codigo})
}

func (fpc *ForgotPasswordController) VerifyCode(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required"`
		Code  string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "Formato JSON invalido"})
		return
	}

	fpc.CodesMux.RLock()
	stored, existe := fpc.Codes[req.Email]
	fpc.CodesMux.RUnlock()

	if !existe || stored.Code != req.Code {
		c.JSON(http.StatusUnauthorized, gin.H{"erro": "Codigo invalido"})
		return
	}

	if time.Now().After(stored.ExpiresAt) {
		fpc.CodesMux.Lock()
		delete(fpc.Codes, req.Email)
		fpc.CodesMux.Unlock()
		c.JSON(http.StatusUnauthorized, gin.H{"erro": "Codigo expirado, solicite um novo"})
		return
	}

	fpc.CodesMux.Lock()
	delete(fpc.Codes, req.Email)
	fpc.CodesMux.Unlock()

	c.JSON(http.StatusOK, gin.H{"mensagem": "Codigo validado com sucesso"})
}

func (fpc *ForgotPasswordController) ResetPassword(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "Formato JSON invalido"})
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		log.Printf("[RESET-PASSWORD] Erro ao hashear senha: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro ao processar senha"})
		return
	}

	res, err := fpc.DB.Exec("UPDATE users SET password = $1 WHERE email = $2", hashedPassword, req.Email)
	if err != nil {
		log.Printf("[RESET-PASSWORD] Erro ao atualizar senha: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro ao atualizar senha"})
		return
	}

	count, err := res.RowsAffected()
	if err != nil || count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"erro": "Usuario nao encontrado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"mensagem": "Senha redefinida com sucesso"})
}
