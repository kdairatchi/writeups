package main

import "testing"

func TestSanitizeTitle(t *testing.T) {
	got := sanitizeTitle("hello\n[bug] | café")
	want := "hello \\[bug\\] \\| café"
	if got != want {
		t.Fatalf("sanitizeTitle() = %q, want %q", got, want)
	}
}

func TestSanitizeTitleTruncatesRunes(t *testing.T) {
	got := sanitizeTitle("012345678901234567890123456789012345678901234567890123456789😀abcdef")
	if len([]rune(got)) != maxTitleLength+3 {
		t.Fatalf("sanitizeTitle() rune length = %d, want %d", len([]rune(got)), maxTitleLength+3)
	}
	if got[len(got)-3:] != "..." {
		t.Fatalf("sanitizeTitle() = %q, want ellipsis suffix", got)
	}
}

func TestFormatFeedLinksDeduplicates(t *testing.T) {
	feeds := []FeedLink{
		{Name: "bug-bounty", URL: "https://medium.com/feed/tag/bug-bounty"},
		{Name: "bug-bounty", URL: "https://medium.com/feed/tag/bug-bounty"},
		{Name: "security", URL: "https://medium.com/feed/tag/security"},
	}
	got := formatFeedLinks(feeds)
	want := "[bug-bounty](https://medium.com/feed/tag/bug-bounty), [security](https://medium.com/feed/tag/security)"
	if got != want {
		t.Fatalf("formatFeedLinks() = %q, want %q", got, want)
	}
}

func TestMarkdownURLPath(t *testing.T) {
	got := markdownURLPath("https://medium.com/a title)\n")
	want := "https://medium.com/a%20title%29"
	if got != want {
		t.Fatalf("markdownURLPath() = %q, want %q", got, want)
	}
}
