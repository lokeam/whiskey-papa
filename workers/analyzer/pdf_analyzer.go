package main

import (
	"github.com/ledongthuc/pdf"
	"github.com/sirupsen/logrus"
)

type PDFAnalyzer struct {
	logger *logrus.Logger
}

// Input data for document analysis
type DocumentInput struct {
	ID       string `json:"id"`
	FilePath string `json:"file_path"`
}

// Output of document analysis
type AnalysisResult struct {
	DocumentID    string  `json:"document_id"`
	PageCount     int     `json:"page_count"`
	FileSize      int64   `json:"file_size"`
	ProcessType   string  `json:"process_type"`
	EstimatedCost float64 `json:"estimated_cost"`
}

// Additional analytics metrics
type ProcessingMetrics struct {
	IsTextBased     bool    `json:"is_text_based"`
	ComplexityScore float64 `json:"complexity_score"`
	AnalysisTime    int64   `json:"analysis_time"`
}

// Init PDFAnalyzer
func NewPDFAnalzyer(logger *logrus.Logger) *PDFAnalyzer {
	return &PDFAnalyzer{
		logger: logger,
	}
}

// Perform PDF analysis
func (pa *PDFAnalyzer) AnalyzeDocument(input DocumentInput) (*AnalysisResult, error) {
	// create a timestamp

	// log the document id and filepath with info notification

	// Build full file path

	// Check if file exists

	// Open and analyze the pdf

	// Determine processing based on pdf page count

	// Calculate estimated cost

	// return the result
}

// Perform basic text detection
func (pa *PDFAnalyzer) analyzePDFContent(filePath string) (int, bool, error) {
	// Open the file, reader, error etc

	// Get the page count

	// Check if document is text-based

	// return page count, and whether its text based
}

func (pa *PDFAnalyzer) detectTextContent(reader *pdf.Reader, pagCount int) bool {
	// Check up to the first three pgs

	// Grab the text content from page

	// if average chars per page is > 100, its text based

	// return whether or not this is a text based doc or not
}

// calculate processing cost base don document characteristics
func (pa *PDFAnalyzer) calculateEstiamtedCost(
	pageCount int,
	fileSize int64,
	isTextBased bool,
) float64 {
	// Set base cost per doc, cost per page and cost per mb

	// If the page isn't a text based doc its 50% more expensive

	// Log details

	// return total cost
}
