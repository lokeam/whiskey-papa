package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/hatchet-dev/hatchet/pkg/client"
	"github.com/hatchet-dev/hatchet/pkg/worker"
	"github.com/joho/godotenv"
)

type InvoiceInput struct {
    InvoiceID string `json:"invoice_id"`
    FilePath  string `json:"file_path"`
}

type StepOutput struct {
    Status  string `json:"status"`
    Message string `json:"message"`
}

func main() {

	// Load .env file
	godotenv.Load()

	// Get Hatchet client
	token := os.Getenv("HATCHET_CLIENT_TOKEN")
	if token == "" {
		fmt.Println("ERROR: There's no HATCHET_CLIENT_TOKEN environment variable")
		return
	}

	// Connect to Hatchet
	c, err := client.New(client.WithToken(token))
	if err != nil {
		fmt.Println("ERROR: could not connect to Hatchet")
		return
	}

	fmt.Println("SUCCESS: Connected to Hatchet")

	// Create worker
	w, err := worker.NewWorker(
		worker.WithClient(c),
		worker.WithName("invoice-fail-worker"),
	)
	if err != nil {
		fmt.Println("ERROR: Count not create worker: ", err)
		return
	}

	fmt.Println("SUCCESS: Created worker 'invoice-fail-worker'")

	// Register workflow
	err = w.RegisterWorkflow(
		&worker.WorkflowJob{
			On: worker.Events("invoice:process"),
			Name: "invoice-processing-pipeline",
			Steps: []*worker.WorkflowStep{
				{
						Name:     "step-1-receive",
						Function: step1Receive,
				},
				{
						Name:     "step-2-validate",
						Function: step2Validate,
						Parents:  []string{"step-1-receive"},
				},
				{
						Name:     "step-3-extract",
						Function: step3Extract,
						Parents:  []string{"step-2-validate"},
				},
				{
						Name:     "step-4-calculate",
						Function: step4Calculate,
						Parents:  []string{"step-3-extract"},
				},
				{
						Name:     "step-5-verify",
						Function: step5Verify,
						Parents:  []string{"step-4-calculate"},
				},
				{
						Name:     "step-6-store",
						Function: step6Store, // NOTE: THIS STEP SHOULD FAIL
						Parents:  []string{"step-5-verify"},
				},
				{
						Name:     "step-7-notify",
						Function: step7Notify,
						Parents:  []string{"step-6-store"},
				},
			},
		},
	)
	if err != nil {
		fmt.Println("ERROR: Cound not register invoice fail workflow: ", err)
		return
	}

	fmt.Println("SUCCESS: Registered workflow 'invoice-processing-pipeline'")
  fmt.Println("Listening for event: invoice:process")

	// Start worker
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




// Simulated workflow Steps
func step1Receive(ctx context.Context, input *InvoiceInput) (*StepOutput, error) {
	fmt.Println("[STEP 1] Receiving invoice...")
	fmt.Printf(" Invoice ID: %s\n", input.InvoiceID)
	time.Sleep(2 * time.Second)

	result := &StepOutput{
		Status: "completed",
		Message: "Invoice successfully received",
	}

	fmt.Println("   ✓ Step 1 complete")
	return result, nil
}

func step2Validate(ctx context.Context, input *InvoiceInput) (*StepOutput, error) {
	fmt.Println("[STEP 2] Validating invoice...")
	time.Sleep(2 * time.Second)

	result := &StepOutput{
		Status: "completed",
		Message: "Invoice validation passed",
	}

	fmt.Println("   ✓ Step 2 complete")
	return result, nil
}

func step3Extract(ctx context.Context, input *InvoiceInput) (*StepOutput, error) {
	fmt.Println("[STEP 3] Extracting data...")
	time.Sleep(2 * time.Second)

	result := &StepOutput{
    Status:  "completed",
    Message: "Data extracted successfully",
  }

	fmt.Println("   ✓ Step 3 complete")
  return result, nil
}

func step4Calculate(ctx context.Context, input *InvoiceInput) (*StepOutput, error) {
	fmt.Println("[STEP 4] Calculating totals...")
	time.Sleep(2 * time.Second)

	result := &StepOutput{
    Status:  "completed",
    Message: "Calculations completed",
  }

	fmt.Println("   ✓ Step 4 complete")
  return result, nil
}

func step5Verify(ctx context.Context, input *InvoiceInput) (*StepOutput, error) {
	fmt.Println("[STEP 5] Verifying invoice...")
	time.Sleep(2 * time.Second)

	result := &StepOutput{
			Status:  "completed",
			Message: "Verification complete",
	}

	fmt.Println("   ✓ Step 5 complete")
	return result, nil
}

func step6Store(ctx context.Context, input *InvoiceInput) (*StepOutput, error) {
	fmt.Println("[STEP 6] Storing invoice...")
	time.Sleep(2 * time.Second)

	// Simulate database connection failure
	fmt.Println("   ✗ Step 6 FAILED: Database connection timeout")
	result := &StepOutput{
		Status:  "failed",
		Message: "Database connection timeout",
	}

	return result, fmt.Errorf("database connection timeout after 30s")
}

// Note: This shouldn't run due to step 6 failure
func step7Notify(ctx context.Context, input *InvoiceInput) (*StepOutput, error) {
	fmt.Println("[STEP 7] Sending notification...")
	time.Sleep(1 * time.Second)

	result := &StepOutput{
		Status:  "completed",
		Message: "Notification sent",
	}

	fmt.Println("   ✓ Step 7 complete")
	return result, nil
}