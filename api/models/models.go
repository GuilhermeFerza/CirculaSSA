package models

import (
	"github.com/golang-jwt/jwt/v5"
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
	LinkContato string  `json:"link_contato" binding:"required"`
	Parceria    bool    `json:"parceria"`
}

type User struct {
	ID           int     `json:"id"`
	Email        string  `json:"email" binding:"required"`
	Password     string  `json:"password" binding:"required"`
	Name         string  `json:"name" binding:"required"`
	Type         string  `json:"type" binding:"required"`
	Lat          float64 `json:"lat"`
	Lon          float64 `json:"lon"`
	RaioAlerta   int     `json:"raio_alerta"`
	RecebeAlerta bool    `json:"recebe_alerta"`
}

type CredenciasLogin struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type Claims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}

type Notificacao struct {
	ID       int    `json:"id"`
	VagaID   int    `json:"vaga_id"`
	Mensagem string `json:"mensagem"`
	Lida     bool   `json:"lida"`
	CriadoEm string `json:"criado_em"`
}
