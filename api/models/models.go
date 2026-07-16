package models

import "github.com/golang-jwt/jwt/v5"

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

type Claims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}
