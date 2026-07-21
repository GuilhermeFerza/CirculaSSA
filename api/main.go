package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/GuilhermeFerza/CirculaSSA/controllers"
	"github.com/GuilhermeFerza/CirculaSSA/models"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

var jwtKey = []byte("CirculaSSA821")

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenHeader := c.GetHeader("Authorization")

		if tokenHeader == "" || !strings.HasPrefix(tokenHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"erro": "Token nao fornecido"})
			c.Abort()
			return
		}

		tokenStrings := strings.TrimPrefix(tokenHeader, "Bearer ")
		claims := &models.Claims{}

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

	frontEndURL := os.Getenv("FRONTEND_URL")

	if frontEndURL == "" {
		frontEndURL = "http://localhost:5173"
	}

	config.AllowOrigins = []string{frontEndURL, "http://192.168.1.185:5173"}
	config.AllowCredentials = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}

	vagaCtrl := &controllers.VagaController{DB: db}
	userCtrl := &controllers.UserController{DB: db, JwtKey: jwtKey}
	salvasCtrl := &controllers.SalvasController{DB: db}
	notificacaoController := &controllers.NotificacaoController{DB: db}

	r.Use(cors.New(config))

	api := r.Group("/api")
	{
		api.GET("/vaga", vagaCtrl.GetVagas)
		api.POST("/login", userCtrl.PostUsers)
		api.GET("/login", AuthMiddleware(), userCtrl.GetUsers)
		api.POST("/register", userCtrl.GetNewUsers)
		api.PUT("/users", AuthMiddleware(), userCtrl.PutUsers)
		api.GET("/notificacoes", AuthMiddleware(), notificacaoController.GetNotif)
		api.PUT("/notificacoes/:id/lida", AuthMiddleware(), notificacaoController.MarcarComoLida)

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

	r.Run(":8081")

}
