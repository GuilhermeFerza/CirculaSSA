package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type Vaga struct {
	ID          int     `json:"id"`
	Titulo      string  `json:"titulo"`
	Descricao   string  `json:"descricao"`
	Empresa     string  `json:"empresa"`
	Tipo        string  `json:"tipo"`
	Bairro      string  `json:"bairro"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	LinkContato string  `json:"link_contato"`
}

type User struct {
	ID       int    `json:"id"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name" binding:"required"`
}

type CredenciasLogin struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

var jwtKey = []byte("CirculaSSA821")

type Claims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenHeader := c.GetHeader("Authorization")

		if tokenHeader == "" || !strings.HasPrefix(tokenHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"erro": "Token nao fornecido"})
			c.Abort()
			return
		}

		tokenStrings := strings.TrimPrefix(tokenHeader, "Bearer ")
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenStrings, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"erro": "Token Invalido"})
			c.Abort()
			return
		}
		c.Set("userEmail", claims.Email)
		c.Next()
	}
}

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Erro ao carregar arquivo .env")
	}

	connStr := os.Getenv("DB_CONN_STR")
	jwtKey := []byte(os.Getenv("JWT_SECRET_KEY"))

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

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}

	r.Use(cors.New(config))

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
		})

		api.POST("/login", func(c *gin.Context) {

			var credenciais CredenciasLogin

			if err := c.ShouldBindJSON(&credenciais); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"erro": "Formato JSON invalido"})
				return
			}

			var idBanco int
			var senhaBanco string

			sqlStatement := `
				SELECT id, password FROM users WHERE email = $1
			`

			err := db.QueryRow(sqlStatement, credenciais.Email).Scan(&idBanco, &senhaBanco)

			if err != nil {
				if err == sql.ErrNoRows {
					c.JSON(http.StatusUnauthorized, gin.H{"erro": "E-mail ou senha incorretos"})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro no banco de dados"})
				return
			}

			if !CheckPasswordHash(credenciais.Password, senhaBanco) {
				c.JSON(http.StatusUnauthorized, gin.H{"erro": "Email ou senha incorretos"})
				return
			}

			tempoExpiracao := time.Now().Add(24 * time.Hour)
			claims := &Claims{
				Email: credenciais.Email,
				RegisteredClaims: jwt.RegisteredClaims{
					ExpiresAt: jwt.NewNumericDate(tempoExpiracao),
				},
			}

			token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

			tokenString, err := token.SignedString(jwtKey)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro ao gerar token"})
				return
			}

			c.JSON(http.StatusOK, gin.H{"token": tokenString})

		})

		api.GET("/login", AuthMiddleware(), func(c *gin.Context) {

			emailToken, existe := c.Get("userEmail")
			if !existe {
				c.JSON(http.StatusUnauthorized, gin.H{"erro": "Usuário não identificado"})
				return
			}

			var idBanco int
			var nameBanco string
			var emailBanco string

			sqlStatement :=
				`
				SELECT id, name, email FROM users WHERE email = $1
			`

			err := db.QueryRow(sqlStatement, emailToken).Scan(&idBanco, &nameBanco, &emailBanco)

			if err != nil {
				if err == sql.ErrNoRows {
					c.JSON(http.StatusNotFound, gin.H{"erro": "Usuário não encontrado no banco"})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao buscar usuario"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"id":    idBanco,
				"name":  nameBanco,
				"email": emailBanco,
			})

		})
		api.POST("/register", func(c *gin.Context) {
			var novoUser User
			if err := c.ShouldBindJSON(&novoUser); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"erro": "Formato de JSON invalido", "detalhes": err.Error()})
				return
			}

			hashedPassword, err := HashPassword(novoUser.Password)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao processar a senha"})
				return
			}

			sqlStatement := `
				INSERT INTO users (email, password, name)
				VALUES ($1, $2, $3)
				RETURNING id
			`

			err = db.QueryRow(sqlStatement,
				novoUser.Email, hashedPassword, novoUser.Name,
			).Scan(&novoUser.ID)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao salvar no banco", "detalhes": err.Error()})
				return
			}

			novoUser.Password = ""
			c.JSON(http.StatusOK, novoUser)
		})

	}

	rotasProtegidas := api.Group("/vaga")
	rotasProtegidas.Use(AuthMiddleware())
	{
		rotasProtegidas.POST("", func(c *gin.Context) {
			emailToken, _ := c.Get("userEmail")

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
				INSERT INTO vagas (titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato, geom, user_id)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_MakePoint($7, $6), 4326), (SELECT id FROM users WHERE email = $9))
				RETURNING id
			`

			err := db.QueryRow(sqlStatement,
				novaVaga.Titulo, novaVaga.Descricao, novaVaga.Empresa,
				novaVaga.Tipo, novaVaga.Bairro, novaVaga.Latitude, novaVaga.Longitude, novaVaga.LinkContato, emailToken,
			).Scan(&novaVaga.ID)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao salvar no banco", "detalhes": err.Error()})
				return
			}

			c.JSON(http.StatusCreated, novaVaga)
		})
		rotasProtegidas.GET("/minhas", func(c *gin.Context) {
			emailToken, _ := c.Get("userEmail")

			query := `
				SELECT id, titulo, descricao, empresa, tipo, bairro, latitude, longitude, link_contato
				FROM vagas
				WHERE user_id = (SELECT id FROM users WHERE email = $1)
			`
			rows, err := db.Query(query, emailToken)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao buscar suas vagas"})
				return
			}
			defer rows.Close()

			var minhasVagas []Vaga
			for rows.Next() {
				var v Vaga
				if err := rows.Scan(&v.ID, &v.Titulo, &v.Descricao, &v.Empresa, &v.Tipo, &v.Bairro, &v.Latitude, &v.Longitude, &v.LinkContato); err == nil {
					minhasVagas = append(minhasVagas, v)
				}
			}
			if minhasVagas == nil {
				minhasVagas = []Vaga{}
			}
			c.JSON(http.StatusOK, minhasVagas)
		})

		rotasProtegidas.PUT("/:id", func(c *gin.Context) {

			emailToken, _ := c.Get("userEmail")

			idStr := c.Param("id")
			id, err := strconv.Atoi(idStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"erro": "ID invalido"})
				return
			}

			var vagaAtualizada Vaga
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
			res, err := db.Exec(sqlStatement,
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
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Vaga nao encontrada"})
				return
			}

			count, err := res.RowsAffected()
			if err != nil || count == 0 {
				c.JSON(http.StatusNotFound, gin.H{"erro": "Vaga nao encontrada"})
				return
			}

			c.JSON(http.StatusOK, gin.H{"mensagem": "Vaga atualizada com sucesso"})

		})
		rotasProtegidas.DELETE("/:id", func(c *gin.Context) {

			emailToken, _ := c.Get("userEmail")

			idStr := c.Param("id")
			id, err := strconv.Atoi(idStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"erro": "ID invalido"})
				return
			}
			sqlStatement := `
				DELETE FROM vagas 
				WHERE id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)
			`
			res, err := db.Exec(sqlStatement, id, emailToken)
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

	rotasSalvas := api.Group("/salvas")
	rotasSalvas.Use(AuthMiddleware())
	{
		rotasSalvas.POST("", func(c *gin.Context) {
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
			_, err := db.Exec(sqlStatement, emailToken, req.VagaID)

			if err != nil {
				if strings.Contains(err.Error(), "unique constraint") {
					c.JSON(http.StatusConflict, gin.H{"erro": "Vaga ja foi salva anteriormente"})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro ao salvar vaga no banco"})
				return
			}
			c.JSON(http.StatusCreated, gin.H{"mensagem": "Vaga salva com sucesso"})
		})

		rotasSalvas.GET("", func(c *gin.Context) {
			emailToken, _ := c.Get("userEmail")

			query := `
				SELECT v.id, v.titulo, v.descricao, v.empresa, v.tipo, v.bairro, v.latitude, v.longitude, v.link_contato
				FROM vagas v
				INNER JOIN vagas_salvas vs ON v.id = vs.vaga_id
				INNER JOIN users u ON u.id = vs.user_id
				WHERE u.email = $1
			`
			rows, err := db.Query(query, emailToken)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao buscar vagas salvas"})
				return
			}
			defer rows.Close()

			var vagasSalvas []Vaga
			for rows.Next() {
				var v Vaga
				if err := rows.Scan(&v.ID, &v.Titulo, &v.Descricao, &v.Empresa, &v.Tipo, &v.Bairro, &v.Latitude, &v.Longitude, &v.LinkContato); err == nil {
					vagasSalvas = append(vagasSalvas, v)
				}
			}

			if vagasSalvas == nil {
				vagasSalvas = []Vaga{}
			}
			c.JSON(http.StatusOK, vagasSalvas)
		})

		rotasSalvas.DELETE("/:id", func(c *gin.Context) {
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
			_, err = db.Exec(sqlStatement, emailToken, vagaID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro ao remover vaga"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"mensagem": "Vaga removida dos favoritos"})
		})
	}

	r.Run(":8080")

}
