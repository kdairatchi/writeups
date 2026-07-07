package main

import (
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"
	"unicode/utf8"
)

type RSS struct {
	Channel Channel `xml:"channel"`
}

type Channel struct {
	Items []Item `xml:"item"`
}

type Item struct {
	Title   string `xml:"title"`
	GUID    string `xml:"guid"`
	PubDate string `xml:"pubDate"`
}

type FeedEntry struct {
	Title   string
	GUID    string
	PubDate string
	Feeds   []FeedLink
	IsNew   bool
	IsToday bool
}

type FeedLink struct {
	Name string
	URL  string
}

const maxTitleLength = 65
const mediumFeedPath = "writeups/medium-feed.md"
const freediumMirrorBase = "https://freedium-mirror.cfd/"

var httpClient = &http.Client{
	Timeout: 20 * time.Second,
}

var feedURLs = []string{
	"https://medium.com/feed/tag/bug-bounty",
	"https://medium.com/feed/tag/security",
	"https://medium.com/feed/tag/vulnerability",
	"https://medium.com/feed/tag/cybersecurity",
	"https://medium.com/feed/tag/penetration-testing",
	"https://medium.com/feed/tag/hacking",
	"https://medium.com/feed/tag/information-technology",
	"https://medium.com/feed/tag/infosec",
	"https://medium.com/feed/tag/web-security",
	"https://medium.com/feed/tag/bug-bounty-tips",
	"https://medium.com/feed/tag/bugs",
	"https://medium.com/feed/tag/pentesting",
	"https://medium.com/feed/tag/xss-attack",
	"https://medium.com/feed/tag/information-security",
	"https://medium.com/feed/tag/cross-site-scripting",
	"https://medium.com/feed/tag/hackerone",
	"https://medium.com/feed/tag/bugcrowd",
	"https://medium.com/feed/tag/bugbounty-writeup",
	"https://medium.com/feed/tag/bug-bounty-writeup",
	"https://medium.com/feed/tag/bug-bounty-hunter",
	"https://medium.com/feed/tag/bug-bounty-program",
	"https://medium.com/feed/tag/ethical-hacking",
	"https://medium.com/feed/tag/application-security",
	"https://medium.com/feed/tag/google-dorking",
	"https://medium.com/feed/tag/dorking",
	"https://medium.com/feed/tag/cyber-security-awareness",
	"https://medium.com/feed/tag/google-dork",
	"https://medium.com/feed/tag/web-pentest",
	"https://medium.com/feed/tag/vdp",
	"https://medium.com/feed/tag/information-disclosure",
	"https://medium.com/feed/tag/exploit",
	"https://medium.com/feed/tag/vulnerability-disclosure",
	"https://medium.com/feed/tag/web-cache-poisoning",
	"https://medium.com/feed/tag/rce",
	"https://medium.com/feed/tag/remote-code-execution",
	"https://medium.com/feed/tag/local-file-inclusion",
	"https://medium.com/feed/tag/vapt",
	"https://medium.com/feed/tag/dorks",
	"https://medium.com/feed/tag/github-dorking",
	"https://medium.com/feed/tag/lfi",
	"https://medium.com/feed/tag/vulnerability-scanning",
	"https://medium.com/feed/tag/subdomain-enumeration",
	"https://medium.com/feed/tag/cybersecurity-tools",
	"https://medium.com/feed/tag/bug-bounty-hunting",
	"https://medium.com/feed/tag/ssrf",
	"https://medium.com/feed/tag/idor",
	"https://medium.com/feed/tag/pentest",
	"https://medium.com/feed/tag/file-upload",
	"https://medium.com/feed/tag/file-inclusion",
	"https://medium.com/feed/tag/security-research",
	"https://medium.com/feed/tag/directory-listing",
	"https://medium.com/feed/tag/log-poisoning",
	"https://medium.com/feed/tag/cve",
	"https://medium.com/feed/tag/xss-vulnerability",
	"https://medium.com/feed/tag/shodan",
	"https://medium.com/feed/tag/censys",
	"https://medium.com/feed/tag/zoomeye",
	"https://medium.com/feed/tag/recon",
	"https://medium.com/feed/tag/xss-bypass",
	"https://medium.com/feed/tag/bounty-program",
	"https://medium.com/feed/tag/subdomain-takeover",
	"https://medium.com/feed/tag/bounties",
	"https://medium.com/feed/tag/api-key",
	"https://medium.com/feed/tag/cyber-sec",
}

func fetchRSSFeed(feedURL string) (*RSS, error) {
	resp, err := httpClient.Get(feedURL)
	if err != nil {
		return nil, fmt.Errorf("fetch %s: %w", feedURL, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf("fetch %s: unexpected status %s", feedURL, resp.Status)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", feedURL, err)
	}

	var rss RSS
	if err := xml.Unmarshal(data, &rss); err != nil {
		return nil, fmt.Errorf("parse %s: %w", feedURL, err)
	}

	return &rss, nil
}

func main() {
	existingFeed, err := os.ReadFile(mediumFeedPath)
	if err != nil && !os.IsNotExist(err) {
		fmt.Fprintf(os.Stderr, "Error reading %s: %v\n", mediumFeedPath, err)
		os.Exit(1)
	}

	existingFeedText := string(existingFeed)
	currentDate := time.Now().UTC().Format("Mon, 02 Jan 2006")
	entries := make(map[string]*FeedEntry)

	for _, feedURL := range feedURLs {
		rss, err := fetchRSSFeed(feedURL)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			continue
		}

		feedLink := FeedLink{Name: extractFeedName(feedURL), URL: feedURL}
		for _, item := range rss.Channel.Items {
			guid := strings.TrimSpace(item.GUID)
			if guid == "" {
				continue
			}
			entry, found := entries[guid]
			if !found {
				entry = &FeedEntry{
					Title:   item.Title,
					GUID:    guid,
					PubDate: item.PubDate,
					IsNew:   !strings.Contains(existingFeedText, guid),
					IsToday: isToday(item.PubDate, currentDate),
				}
				entries[guid] = entry
			}
			entry.Feeds = append(entry.Feeds, feedLink)
		}

		time.Sleep(3 * time.Second)
	}

	entryList := make([]*FeedEntry, 0, len(entries))
	for _, entry := range entries {
		entryList = append(entryList, entry)
	}

	sort.SliceStable(entryList, func(i, j int) bool {
		if entryList[i].IsNew != entryList[j].IsNew {
			return entryList[i].IsNew
		}
		if entryList[i].IsToday != entryList[j].IsToday {
			return entryList[i].IsToday
		}
		return entryList[i].PubDate > entryList[j].PubDate
	})

	fmt.Println("| Time | Title | Feed | IsNew | IsToday |")
	fmt.Println("|-----------|-----|-----|-----|-----|")
	for _, entry := range entryList {
		fmt.Printf("| %s | [%s](%s%s) | %s | %s | %s |\n",
			entry.PubDate,
			sanitizeTitle(entry.Title),
			freediumMirrorBase,
			markdownURLPath(entry.GUID),
			formatFeedLinks(entry.Feeds),
			formatYes(entry.IsNew),
			formatYes(entry.IsToday),
		)
	}
}

func markdownURLPath(value string) string {
	value = strings.ReplaceAll(value, " ", "%20")
	value = strings.ReplaceAll(value, ")", "%29")
	return strings.ReplaceAll(value, "\n", "")
}

func extractFeedName(feedURL string) string {
	parts := strings.Split(strings.TrimRight(feedURL, "/"), "/")
	return parts[len(parts)-1]
}

func sanitizeTitle(title string) string {
	title = strings.Join(strings.Fields(title), " ")
	title = strings.ReplaceAll(title, "|", "\\|")
	title = strings.ReplaceAll(title, "[", "\\[")
	title = strings.ReplaceAll(title, "]", "\\]")

	if utf8.RuneCountInString(title) > maxTitleLength {
		runes := []rune(title)
		title = string(runes[:maxTitleLength]) + "..."
	}

	return title
}

func isToday(pubDate, currentDate string) bool {
	pubTime, err := time.Parse(time.RFC1123, pubDate)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing date %s: %v\n", pubDate, err)
		return false
	}

	return pubTime.UTC().Format("Mon, 02 Jan 2006") == currentDate
}

func formatFeedLinks(feeds []FeedLink) string {
	links := make([]string, 0, len(feeds))
	seen := make(map[string]bool, len(feeds))
	for _, feed := range feeds {
		key := feed.Name + "\x00" + feed.URL
		if seen[key] {
			continue
		}
		seen[key] = true
		links = append(links, fmt.Sprintf("[%s](%s)", feed.Name, feed.URL))
	}
	return strings.Join(links, ", ")
}

func formatYes(value bool) string {
	if value {
		return "Yes"
	}
	return ""
}
