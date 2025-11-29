package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/hatchet-dev/hatchet/pkg/client"
	"github.com/hatchet-dev/hatchet/pkg/worker"
	"github.com/joho/godotenv"
)

// Input/Output types for document processing workflow
type DocumentInput struct {
	DocumentID string `json:"document_id"`
	FilePath   string `json:"file_path"`
}

type UploadOutput struct {
	Status     string `json:"status"`
	DocumentID string `json:"document_id"`
	FileSize   int    `json:"file_size"`
	UploadedAt string `json:"uploaded_at"`
}

type ValidateOutput struct {
	Status    string `json:"status"`
	Valid     bool   `json:"valid"`
	FileType  string `json:"file_type"`
	PageCount int    `json:"page_count"`
}

type ExtractOutput struct {
	Status        string `json:"status"`
	TextExtracted bool   `json:"text_extracted"`
	ImageCount    int    `json:"image_count"`
	TableCount    int    `json:"table_count"`
}

type ParseOutput struct {
	Status   string   `json:"status"`
	WordCount int     `json:"word_count,omitempty"`
	Language string   `json:"language,omitempty"`
	Entities []string `json:"entities,omitempty"`
	Images   []string `json:"images,omitempty"`
	Tables   []map[string]interface{} `json:"tables,omitempty"`
}

type TransformOutput struct {
	Status         string `json:"status"`
	Normalized     bool   `json:"normalized"`
	Enriched       bool   `json:"enriched"`
	RecordsCreated int    `json:"records_created"`
}

type StorageOutput struct {
	Status   string `json:"status"`
	Location string `json:"location"`
	RecordID string `json:"record_id,omitempty"`
	Indexed  bool   `json:"indexed,omitempty"`
}

type NotifyOutput struct {
	Status        string   `json:"status"`
	Notified      []string `json:"notified"`
	NotificationsSent int  `json:"notifications_sent"`
}

type CleanupOutput struct {
	Status       string `json:"status"`
	TempFilesRemoved int `json:"temp_files_removed"`
	CacheCleared bool   `json:"cache_cleared"`
}

func main() {
	// Grab .env file
	godotenv.Load()

	// grab hatchet token
	token := os.Getenv("HATCHET_CLIENT_TOKEN")
	if token == "" {
		fmt.Println("ERROR: There's no HATCHET_CLIENT_TOKEN environment variable")
		return
	}

	// Try and reconnect to Hatchet
	c, err := client.New(client.WithToken(token))
	if err != nil {
		fmt.Println("ERROR: Could not connect to Hatchet")
	}

	fmt.Println("SUCCESS: Connected to Hatchet")
	fmt.Println("Hatchet Client: ", c)

	// ------------------------ WORKER ------------------------
	// Separate this out into separate file later

	w, err := worker.NewWorker(
		worker.WithClient(c),
		worker.WithName("test-worker"),
	)
	if err != nil {
		fmt.Println("ERROR: Could not create worker: ", err)
		return
	}

	fmt.Println("SUCCESS: Created worker")
	fmt.Println("Worker: ", w)

	// ================== Register Document Processing Workflow
	err = w.RegisterWorkflow(
		&worker.WorkflowJob{
			On:   worker.Events("document:process"),
			Name: "document-processing-pipeline",
			Steps: []*worker.WorkflowStep{
				// Stage 1: Upload
				{
					Name:     "upload",
					Function: uploadStep,
				},
				// Stage 2: Validate
				{
					Name:     "validate",
					Function: validateStep,
					Parents:  []string{"upload"},
				},
				// Stage 3: Extract
				{
					Name:     "extract",
					Function: extractStep,
					Parents:  []string{"validate"},
				},
				// Stage 4: Parse operations (parallel)
				{
					Name:     "parse-text",
					Function: parseTextStep,
					Parents:  []string{"extract"},
				},
				{
					Name:     "parse-images",
					Function: parseImagesStep,
					Parents:  []string{"extract"},
				},
				{
					Name:     "parse-tables",
					Function: parseTablesStep,
					Parents:  []string{"extract"},
				},
				// Stage 5: Transform
				{
					Name:     "transform",
					Function: transformStep,
					Parents:  []string{"parse-text", "parse-images", "parse-tables"},
				},
				// Stage 6: Storage operations (parallel)
				{
					Name:     "store-database",
					Function: storeDatabaseStep,
					Parents:  []string{"transform"},
				},
				{
					Name:     "store-s3",
					Function: storeS3Step,
					Parents:  []string{"transform"},
				},
				{
					Name:     "index-search",
					Function: indexSearchStep,
					Parents:  []string{"transform"},
				},
				// Stage 7: Notify
				{
					Name:     "notify",
					Function: notifyStep,
					Parents:  []string{"store-database", "store-s3", "index-search"},
				},
				// Stage 8: Cleanup
				{
					Name:     "cleanup",
					Function: cleanupStep,
					Parents:  []string{"notify"},
				},
			},
		},
	)
	if err != nil {
		fmt.Println("ERROR: Could not register workflow: ", err)
		return
	}

	fmt.Println("SUCCESS: Registered workflow 'document-processing-pipeline'")
	fmt.Println("Listening for event: document:process")

	// Start worker and cleanup
	cleanup, err := w.Start()
	if err != nil {
		fmt.Println("ERROR: Could not start worker: ", err)
		return
	}
	defer cleanup()

	fmt.Println("✅ Worker is running and listening for tasks")
	fmt.Println("Press Ctrl+C to stop")

	// Wait for signal to stop
	select {}
}

// ==================== WORKFLOW STEPS ====================

// Stage 1: Upload
func uploadStep(ctx context.Context, input *DocumentInput) (*UploadOutput, error) {
	captureEvent("STEP_STARTED", "upload", input)
	fmt.Println("� [UPLOAD] Starting document upload...")
	fmt.Printf("   Document ID: %s\n", input.DocumentID)

	time.Sleep(2 * time.Second)

	result := &UploadOutput{
		Status:     "completed",
		DocumentID: input.DocumentID,
		FileSize:   2457600, // 2.4 MB
		UploadedAt: time.Now().Format(time.RFC3339),
	}

	fmt.Println("   ✓ Upload complete")
	captureEvent("STEP_COMPLETED", "upload", result)
	return result, nil
}

// Stage 2: Validate
func validateStep(ctx context.Context, input *DocumentInput) (*ValidateOutput, error) {
	captureEvent("STEP_STARTED", "validate", input)
	fmt.Println("✅ [VALIDATE] Validating document...")

	time.Sleep(2 * time.Second)

	result := &ValidateOutput{
		Status:    "completed",
		Valid:     true,
		FileType:  "application/pdf",
		PageCount: 47,
	}

	fmt.Println("   ✓ Validation passed - 47 pages")
	captureEvent("STEP_COMPLETED", "validate", result)
	return result, nil
}

// Stage 3: Extract
func extractStep(ctx context.Context, input *DocumentInput) (*ExtractOutput, error) {
	captureEvent("STEP_STARTED", "extract", input)
	fmt.Println("🔍 [EXTRACT] Extracting content...")

	time.Sleep(3 * time.Second)

	result := &ExtractOutput{
		Status:        "completed",
		TextExtracted: true,
		ImageCount:    12,
		TableCount:    8,
	}

	fmt.Println("   ✓ Extracted: 12 images, 8 tables")
	captureEvent("STEP_COMPLETED", "extract", result)
	return result, nil
}

// Stage 4: Parse Text (parallel)
func parseTextStep(ctx context.Context, input *DocumentInput) (*ParseOutput, error) {
	captureEvent("STEP_STARTED", "parse-text", input)
	fmt.Println("📄 [PARSE-TEXT] Parsing text content...")

	time.Sleep(3 * time.Second)

	result := &ParseOutput{
		Status:    "completed",
		WordCount: 15234,
		Language:  "en",
		Entities:  []string{"Acme Corporation", "John Smith", "New York", "Q4 2024"},
	}

	fmt.Println("   ✓ Parsed 15,234 words, detected 4 entities")
	captureEvent("STEP_COMPLETED", "parse-text", result)
	return result, nil
}

// Stage 4: Parse Images (parallel)
func parseImagesStep(ctx context.Context, input *DocumentInput) (*ParseOutput, error) {
	captureEvent("STEP_STARTED", "parse-images", input)
	fmt.Println("🖼️  [PARSE-IMAGES] Processing images...")

	time.Sleep(4 * time.Second)

	result := &ParseOutput{
		Status: "completed",
		Images: []string{"chart_revenue.png", "logo.png", "diagram_architecture.png"},
	}

	fmt.Println("   ✓ Processed 3 images")
	captureEvent("STEP_COMPLETED", "parse-images", result)
	return result, nil
}

// Stage 4: Parse Tables (parallel)
func parseTablesStep(ctx context.Context, input *DocumentInput) (*ParseOutput, error) {
	captureEvent("STEP_STARTED", "parse-tables", input)
	fmt.Println("📊 [PARSE-TABLES] Extracting tables...")

	time.Sleep(3 * time.Second)

	result := &ParseOutput{
		Status: "completed",
		Tables: []map[string]interface{}{
			{"name": "Revenue Summary", "rows": 24, "columns": 6},
			{"name": "Employee Data", "rows": 156, "columns": 8},
		},
	}

	fmt.Println("   ✓ Extracted 2 tables")
	captureEvent("STEP_COMPLETED", "parse-tables", result)
	return result, nil
}

// Stage 5: Transform
func transformStep(ctx context.Context, input *DocumentInput) (*TransformOutput, error) {
	captureEvent("STEP_STARTED", "transform", input)
	fmt.Println("⚙️  [TRANSFORM] Transforming and enriching data...")

	time.Sleep(2 * time.Second)

	result := &TransformOutput{
		Status:         "completed",
		Normalized:     true,
		Enriched:       true,
		RecordsCreated: 342,
	}

	fmt.Println("   ✓ Created 342 normalized records")
	captureEvent("STEP_COMPLETED", "transform", result)
	return result, nil
}

// Stage 6: Store Database (parallel)
func storeDatabaseStep(ctx context.Context, input *DocumentInput) (*StorageOutput, error) {
	captureEvent("STEP_STARTED", "store-database", input)
	fmt.Println("💾 [STORE-DB] Storing to database...")

	time.Sleep(2 * time.Second)

	result := &StorageOutput{
		Status:   "completed",
		Location: "postgresql://documents/",
		RecordID: "doc_" + input.DocumentID,
	}

	fmt.Println("   ✓ Stored in PostgreSQL")
	captureEvent("STEP_COMPLETED", "store-database", result)
	return result, nil
}

// Stage 6: Store S3 (parallel)
func storeS3Step(ctx context.Context, input *DocumentInput) (*StorageOutput, error) {
	captureEvent("STEP_STARTED", "store-s3", input)
	fmt.Println("☁️  [STORE-S3] Uploading to S3...")

	time.Sleep(3 * time.Second)

	result := &StorageOutput{
		Status:   "completed",
		Location: "s3://documents-bucket/" + input.DocumentID + ".pdf",
	}

	fmt.Println("   ✓ Uploaded to S3")
	captureEvent("STEP_COMPLETED", "store-s3", result)
	return result, nil
}

// Stage 6: Index Search (parallel)
func indexSearchStep(ctx context.Context, input *DocumentInput) (*StorageOutput, error) {
	captureEvent("STEP_STARTED", "index-search", input)
	fmt.Println("🔎 [INDEX] Indexing for search...")

	time.Sleep(2 * time.Second)

	result := &StorageOutput{
		Status:  "completed",
		Location: "elasticsearch://documents/",
		Indexed: true,
	}

	fmt.Println("   ✓ Indexed in Elasticsearch")
	captureEvent("STEP_COMPLETED", "index-search", result)
	return result, nil
}

// Stage 7: Notify
func notifyStep(ctx context.Context, input *DocumentInput) (*NotifyOutput, error) {
	captureEvent("STEP_STARTED", "notify", input)
	fmt.Println("📧 [NOTIFY] Sending notifications...")

	time.Sleep(1 * time.Second)

	result := &NotifyOutput{
		Status:            "completed",
		Notified:          []string{"user@example.com", "admin@example.com"},
		NotificationsSent: 2,
	}

	fmt.Println("   ✓ Sent 2 notifications")
	captureEvent("STEP_COMPLETED", "notify", result)
	return result, nil
}

// Stage 8: Cleanup
func cleanupStep(ctx context.Context, input *DocumentInput) (*CleanupOutput, error) {
	captureEvent("STEP_STARTED", "cleanup", input)
	fmt.Println("🧹 [CLEANUP] Cleaning up temporary files...")

	time.Sleep(1 * time.Second)

	result := &CleanupOutput{
		Status:           "completed",
		TempFilesRemoved: 15,
		CacheCleared:     true,
	}

	fmt.Println("   ✓ Cleanup complete")
	fmt.Println("\n🎉 Document processing pipeline finished!\n")
	captureEvent("STEP_COMPLETED", "cleanup", result)
	return result, nil
}

// Captures workflow events and saves to JSON file
func captureEvent(eventType, stepName string, data any) {
	event := map[string]any{
		"timestamp": time.Now().Format(time.RFC3339),
		"type":     eventType,
		"step":     stepName,
		"data":     data,
	}

	// Convert to JSON
	jsonData, err := json.Marshal(event)
	if err != nil {
			fmt.Println("ERROR: Could not marshal JSON:", err)
			return
	}

	// Append to JSON Lines file
	f, err := os.OpenFile("workflow-events.jsonl", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
			fmt.Println("ERROR: Could not open file:", err)
			return
	}
	defer f.Close()

	f.WriteString(string(jsonData) + "\n")
	fmt.Printf("📨 Captured: %s - %s\n", eventType, stepName)
}
