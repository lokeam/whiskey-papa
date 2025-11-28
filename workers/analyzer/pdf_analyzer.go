package main

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

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
	startTime := time.Now()

	// log the document id and filepath with info notification
	pa.logger.WithFields(logrus.Fields{
		"document_id": input.ID,
		"file_path": input.FilePath,
	}).Info("Starting document analysis")

	// Build full file path
	fullFilePath := filepath.Join(".", "storage", "uploads", fmt.Sprintf("%s.pdf", input.ID))

	// Check if file exists
	fileInfo, err := os.Stat(fullFilePath)
	if err != nil {
		pa.logger.WithError(err).Error("Failed to access PDF file")
		return nil, fmt.Errorf("failed to access PDF file: %w", err)
	}

	fileSize := fileInfo.Size()
	pa.logger.WithField("file_size", fileSize).Info("Retrieved file size")

	// Open and analyze the pdf
	pageCount, isTextBased, err := pa.analyzePDFContent(fullFilePath)
	if err != nil {
		pa.logger.WithError(err).Error("Failed to analyze PDF content")
		return nil, fmt.Errorf("failed to analyze PDF content: %w", err)
	}

	// Determine processing based on pdf page count
	processType := "simple"
	if pageCount >= 10 {
		processType = "parallel"
	}

	// Calculate estimated cost
	estimatedCost := pa.calculateEstimatedCost(pageCount, fileSize, isTextBased)

	analysisTime := time.Since(startTime).Milliseconds()

	result := &AnalysisResult{
		DocumentID:    input.ID,
		PageCount:     pageCount,
		FileSize:      fileSize,
		ProcessType:   processType,
		EstimatedCost: estimatedCost,
	}

	pa.logger.WithFields(logrus.Fields{
		"document_id":     result.DocumentID,
		"page_count":      result.PageCount,
		"file_size":       result.FileSize,
		"process_type":    result.ProcessType,
		"estimated_cost":  result.EstimatedCost,
		"analysis_time":   analysisTime,
		"is_text_based":   isTextBased,
	}).Info("Document analysis completed")

	// return the result
	return result, nil
}

// Perform basic text detection
func (pa *PDFAnalyzer) analyzePDFContent(filePath string) (int, bool, error) {
	// Open the file, reader, error etc
	file, reader, err := pdf.Open(filePath)
	if err != nil {
		return 0, false, fmt.Errorf("failed to open PDF: %w", err)
	}
	defer file.Close()

	// Get the page count
	pageCount := reader.NumPage()
	pa.logger.WithField("page_count", pageCount).Info("Extracted page count")

	// Check if document is text-based
	isTextBased := pa.detectTextContent(reader, pageCount)

	// return page count, and whether its text based
	return pageCount, isTextBased, nil
}

func (pa *PDFAnalyzer) detectTextContent(reader *pdf.Reader, pageCount int) bool {
	// Check up to the first three pgs
	pagesToCheck := 3
	if pageCount < pagesToCheck {
		pagesToCheck = pageCount
	}

	textCharCount := 0
	totalChecked := 0

	for i := 1; i <= pagesToCheck; i++ {
		page := reader.Page(i)

		if page.V.IsNull() {
			continue
		}

		// Grab the text content from page
		text, err := page.GetPlainText(nil) // Pass nil for fonts map
		if err != nil {
			pa.logger.WithError(err).Warnf("Failed to extract text from page %d", i)
			continue
		}

		textCharCount += len(text)
		totalChecked++
	}

	// if average chars per page is > 100, its text based
	if totalChecked == 0 {
		return false
	}

	avgCharsPerPage := textCharCount / totalChecked
	isTextBased := avgCharsPerPage > 100

	pa.logger.WithFields(logrus.Fields{
		"pages_checked":        totalChecked,
		"total_text_chars":     textCharCount,
		"avg_chars_per_page":   avgCharsPerPage,
		"is_text_based":        isTextBased,
	}).Info("Text content analysis completed")

	// return whether or not this is a text based doc or not
	return isTextBased
}

// calculate processing cost based on document characteristics
func (pa *PDFAnalyzer) calculateEstimatedCost(
	pageCount int,
	fileSize int64,
	isTextBased bool,
) float64 {
	// Set base cost per doc, cost per page and cost per mb
	baseCost := 0.10 // Base cost per document
	pageCost := float64(pageCount) * 0.05 // $0.05 per page
	sizeCost := float64(fileSize) / (1024 * 1024) * 0.02 // $0.02 per MB

	// If the page isn't a text based doc its 50% more expensive
	multiplier := 1.0
	if !isTextBased {
		multiplier = 1.5 // 50% more expensive for image-heavy documents
	}

	totalCost := (baseCost + pageCost + sizeCost) * multiplier

	// Log details
	pa.logger.WithFields(logrus.Fields{
		"base_cost":    baseCost,
		"page_cost":    pageCost,
		"size_cost":    sizeCost,
		"multiplier":   multiplier,
		"total_cost":   totalCost,
	}).Debug("Cost calculation completed")

	// return total cost
	return totalCost
}
