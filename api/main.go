package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/GuilhermeFerza/CirculaSSA/controllers"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type Vaga struct {
	ID          int     `json:"id"`
	Titulo      string  `json:"titulo" binding:"required,min=3,max=100"`
	Descricao   string  `json:"descricao" binding:"required,min=10"`
	Empresa     string  `json:"empresa" binding:"required"`
	Tipo        string  `json:"tipo" binding:"required,oneof=CLT Estágio 'Jovem Aprendiz' Mutirão"`
	Bairro      string  `json:"bairro" binding:"required"`
	Latitude    float64 `json:"latitude" binding:"required"`
	Longitude   float64 `json:"longitude" binding:"required"`
	LinkContato string  `json:"link_contato" binding:"required,url"`
}

type User struct {
	ID       int    `json:"id"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Type     string `json:"type" binding:"required"`
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

	vagaCtrl := &controllers.VagaController{DB: db}
	userCtrl := &controllers.UserController{DB: db, JwtKey: jwtKey}
	salvasCtrl := &controllers.SalvasController{DB: db}

	r.Use(cors.New(config))

	api := r.Group("/api")
	{
		api.GET("/vaga", vagaCtrl.GetVagas)

		api.POST("/login", userCtrl.PostUsers)

		api.GET("/login", AuthMiddleware(), userCtrl.GetUsers)
		api.POST("/register", userCtrl.GetNewUsers)

	}

	rotasProtegidas := api.Group("/vaga")
	rotasProtegidas.Use(AuthMiddleware())
	{
		rotasProtegidas.POST("", vagaCtrl.PostVagas)
		rotasProtegidas.GET("/minhas", vagaCtrl.GetMinhasVagas)
		rotasProtegidas.PUT("/:id", vagaCtrl.PutVagas)
		rotasProtegidas.DELETE("/:id", vagaCtrl.DeleteVagas)
	}

	rotasSalvas := api.Group("/salvas")
	rotasSalvas.Use(AuthMiddleware())
	{
		rotasSalvas.POST("", salvasCtrl.PostSalvas)
		rotasSalvas.GET("", salvasCtrl.GetSalvas)
		rotasSalvas.DELETE("/:id", salvasCtrl.DeleteSalvas)
	}

	r.Run(":8080")

}
