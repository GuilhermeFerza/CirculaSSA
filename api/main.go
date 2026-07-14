package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
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
			}

			if credenciais.Password != senhaBanco {
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

			sqlStatement := `
				INSERT INTO users (email, password, name)
				VALUES ($1, $2, $3)
				RETURNING id
			`

			err := db.QueryRow(sqlStatement,
				novoUser.Email, novoUser.Password, novoUser.Name,
			).Scan(&novoUser.ID)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao salvar no banco", "detalhes": err.Error()})
				return
			}
			c.JSON(http.StatusOK, novoUser)
		})

	}

	rotasProtegidas := api.Group("/vaga")
	rotasProtegidas.Use(AuthMiddleware())
	{
		rotasProtegidas.POST("", func(c *gin.Context) {
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
		rotasProtegidas.PUT("/:id", func(c *gin.Context) {
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
				SET titulo = $1, descricao =$2, empresa = $3, tipo = $4, bairro = $5, latitude = $6, longitude = $7, geom = ST_SetSRID(ST_MakePoint($7, $6), 4326)
				WHERE id = $8

			`
			res, err := db.Exec(sqlStatement,
				vagaAtualizada.Titulo,
				vagaAtualizada.Descricao,
				vagaAtualizada.Empresa,
				vagaAtualizada.Tipo,
				vagaAtualizada.Bairro,
				vagaAtualizada.Latitude,
				vagaAtualizada.Longitude,
				id,
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
