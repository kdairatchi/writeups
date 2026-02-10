package main

import (
	"os"
	"testing"
	"time"
)

func TestGetEnvInt(t *testing.T) {
	const key = "TEST_INT"
	os.Unsetenv(key)
	if v := getEnvInt(key, 5); v != 5 {
		t.Fatalf("expected default 5, got %d", v)
	}
	os.Setenv(key, "10")
	if v := getEnvInt(key, 5); v != 10 {
		t.Fatalf("expected 10, got %d", v)
	}
	os.Unsetenv(key)
}

func TestGetEnvDuration(t *testing.T) {
	const key = "TEST_DURATION"
	os.Unsetenv(key)
	if v := getEnvDuration(key, 2); v != 2*time.Second {
		t.Fatalf("expected default 2s, got %v", v)
	}
	os.Setenv(key, "5")
	if v := getEnvDuration(key, 2); v != 5*time.Second {
		t.Fatalf("expected 5s, got %v", v)
	}
	os.Unsetenv(key)
}

func TestGetEnvBool(t *testing.T) {
	const key = "TEST_BOOL"
	os.Unsetenv(key)
	if v := getEnvBool(key, true); v != true {
		t.Fatalf("expected default true, got %v", v)
	}
	os.Setenv(key, "false")
	if v := getEnvBool(key, true); v != false {
		t.Fatalf("expected false, got %v", v)
	}
	os.Unsetenv(key)
}
