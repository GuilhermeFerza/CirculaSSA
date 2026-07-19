package controllers

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/GuilhermeFerza/CirculaSSA/models"
	"github.com/GuilhermeFerza/CirculaSSA/utils"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type UserController struct {
	DB     *sql.DB
	JwtKey []byte
}

func (uc *UserController) GetUsers(c *gin.Context) {
	emailToken, existe := c.Get("userEmail")
	if !existe {
		c.JSON(http.StatusUnauthorized, gin.H{"erro": "Usuário não identificado"})
		return
	}

	var idBanco int
	var nameBanco string
	var emailBanco string
	var typeBanco string

	sqlStatement :=
		`
				SELECT id, name, email, type FROM users WHERE email = $1
			`

	err := uc.DB.QueryRow(sqlStatement, emailToken).Scan(&idBanco, &nameBanco, &emailBanco, &typeBanco)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"erro": "Usuário não encontrado no banco"})
			return
		}
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao buscar usuario"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":    idBanco,
		"name":  nameBanco,
		"email": emailBanco,
		"type":  typeBanco,
	})
}

func (uc *UserController) PostUsers(c *gin.Context) {
	var credenciais models.CredenciasLogin

	if err := c.ShouldBindJSON(&credenciais); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "Formato JSON invalido"})
		return
	}

	var idBanco int
	var senhaBanco string
	var tipoBanco string

	sqlStatement := `
				SELECT id, password, type FROM users WHERE email = $1
			`

	err := uc.DB.QueryRow(sqlStatement, credenciais.Email).Scan(&idBanco, &senhaBanco, &tipoBanco)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"erro": "E-mail ou senha incorretos"})
			return
		}
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro no banco de dados"})
		return
	}

	if !utils.CheckPasswordHash(credenciais.Password, senhaBanco) {
		c.JSON(http.StatusUnauthorized, gin.H{"erro": "Email ou senha incorretos"})
		return
	}

	tempoExpiracao := time.Now().Add(24 * time.Hour)
	claims := models.Claims{
		Email: credenciais.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(tempoExpiracao),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(uc.JwtKey)
	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro ao gerar token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": tokenString, "type": tipoBanco})

}

func (uc *UserController) PutUsers(c *gin.Context) {

	emailToken, existe := c.Get("userEmail")
	if !existe {
		c.JSON(http.StatusUnauthorized, gin.H{"erro": "Usuario nao identificado"})
		return
	}

	var perfilAtualizado struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&perfilAtualizado); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "Formato de JSON inválido", "detalhes": err.Error()})
		return
	}

	sqlStatement := `
		UPDATE users
		SET name = $1
		WHERE email = $2
	`

	res, err := uc.DB.Exec(sqlStatement, perfilAtualizado.Name, emailToken)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro interno ao atualizar perfil"})
		return
	}

	count, err := res.RowsAffected()
	if err != nil || count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"erro": "Erro interno ao atualizar perfil"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"mensagem": "perfil atualizado com sucesso"})

}

func (uc *UserController) GetNewUsers(c *gin.Context) {
	var novoUser models.User
	if err := c.ShouldBindJSON(&novoUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "Formato de JSON invalido", "detalhes": err.Error()})
		return
	}

	hashedPassword, err := utils.HashPassword(novoUser.Password)
	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao processar a senha"})
		return
	}

	sqlStatement := `
				INSERT INTO users (email, password, name, type)
				VALUES ($1, $2, $3, $4)
				RETURNING id
			`

	err = uc.DB.QueryRow(sqlStatement,
		novoUser.Email, hashedPassword, novoUser.Name, novoUser.Type,
	).Scan(&novoUser.ID)

	if err != nil {
		log.Printf("[SECURITY/ERROR] Rota: %s | Erro: %v | IP: %s", c.Request.URL.Path, err, c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao salvar no banco", "detalhes": err.Error()})
		return
	}

	novoUser.Password = ""
	c.JSON(http.StatusOK, novoUser)
}
