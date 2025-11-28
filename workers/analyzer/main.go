package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/hatchet-dev/hatchet/pkg/client"
	"github.com/hatchet-dev/hatchet/pkg/worker"
	"github.com/sirupsen/logrus"
)

const HATCHET_HOST = "104ad.cloud.onhatchet.run"
const HATCHET_PORT = 443

func main() {
	// init structured logger
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetLevel(logrus.InfoLevel)

	logger.Info("Starting Analyzer Worker")

	// get Hatchet client token from env
	token := os.Getenv("HATCHET_CLIENT_TOKEN")
	if token == "" {
		logger.Fatal("cannot find HATCHET_CLIENT_TOKEN environment variable")
	}

	// Init Hatchet client
	c, err := client.New(
		client.WithHostPort(HATCHET_HOST, HATCHET_PORT),
		client.WithToken(token),
	)
	if err != nil {
		logger.WithError(err).Fatal("Failed to create Hatchet client")
	}

	// Initialize PDF Analayzer (will be created in step function)
	// pdfAnalyzer := NewPDFAnalzyer(logger)

	// Create worker instance, process up to 10 jobs concurrently
	w, err := worker.NewWorker(
		worker.WithClient(c),
		worker.WithMaxRuns(10),
	)
	if err != nil {
		logger.WithError(err).Fatal("Failed to create worker")
	}

	// Register the analyzer workflow, trigger the worker on upload, retry up to 3x on failure
	err = w.RegisterWorkflow(
		&worker.WorkflowJob{
			Name:        "analyze-document",
			Description: "Analyzes PDF documents to determine processing strategy",
			On: worker.Events("document:uploaded"),
			Steps: []*worker.WorkflowStep{
				{
					Name: "analyze",
					Function: analyzeDocumentStep,
					Retries: 3,
				},
			},
		},
	)
	if err != nil {
		logger.WithError(err).Fatal("Failed to register workflow")
	}

	logger.Info("Workflow registered successfully")

	// Start the worker
	logger.Info("Starting worker...")
	cleanup, err := w.Start()
	if err != nil {
		logger.WithError(err).Fatal("Failed to start worker")
	}

	// Set up graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	logger.Info("Analyzer worker is running. Press Ctrl+C to exit.")
	<-quit

	logger.Info("Shutting down worker...")

	// Cleanup using the fn returned by Start()
	if err := cleanup(); err != nil {
		logger.WithError(err).Error("Error during worker shutdown")
	}

	logger.Info("Analyzer worker stopped")
}

// main step fn for document analysis
// main step fn for document analysis
func analyzeDocumentStep(ctx worker.HatchetContext, input *DocumentInput) (*AnalysisResult, error) {
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetLevel(logrus.InfoLevel)

	pdfAnalyzer := NewPDFAnalzyer(logger)

	// call logger with fields to start processing
	logger.WithFields(logrus.Fields{
		"workflow_run_id": ctx.WorkflowRunId(),
		"step_run_id":     ctx.StepRunId(),
		"document_id":     input.ID,
	}).Info("Document analysis: PROCESSING")

	// Perform document analysis
	result, err := pdfAnalyzer.AnalyzeDocument(*input)
	if err != nil {
		logger.WithError(err).Error("Document analysis failed")
		return nil, fmt.Errorf("document analysis failed: %w", err)
	}

	// call logger with fields again to finish processing
	logger.WithFields(logrus.Fields{
		"workflow_run_id": ctx.WorkflowRunId(),
		"document_id":     result.DocumentID,
		"process_type":    result.ProcessType,
		"page_count":      result.PageCount,
	}).Info("Document analysis: COMPLETED SUCCESSFULLY")

	// return result
	return result, nil
}
