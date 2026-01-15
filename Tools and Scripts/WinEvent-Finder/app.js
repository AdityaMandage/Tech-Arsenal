document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsInfo = document.getElementById('resultsInfo');
    
    let eventData = [];
    let fuse;

    // 1. Fetch the JSON Database
    fetch('events.json')
        .then(response => response.json())
        .then(data => {
            eventData = data;
            initializeSearch();
        })
        .catch(err => {
            resultsContainer.innerHTML = `<div class="error">Error loading database. Please ensure events.json is in the same folder.</div>`;
        });

    // 2. Initialize Fuse.js (The "AI" Engine)
    function initializeSearch() {
        const options = {
            includeScore: true,
            threshold: 0.3, // 0.0 = perfect match, 1.0 = match anything
            keys: [
                { name: 'id', weight: 0.4 },          // High priority for ID
                { name: 'description', weight: 0.3 }, // High priority for description
                { name: 'category', weight: 0.2 },
                { name: 'notes', weight: 0.1 },
                { name: 'source', weight: 0.1 }
            ]
        };

        fuse = new Fuse(eventData, options);

        // Show all events initially (optional, or show nothing)
        renderResults(eventData.slice(0, 20)); // Show top 20 default
    }

    // 3. Search Listener
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;

        if (query.trim() === '') {
            renderResults(eventData.slice(0, 20));
            resultsInfo.textContent = "Showing common events";
            return;
        }

        // Perform the fuzzy search
        const results = fuse.search(query);
        const formattedResults = results.map(result => result.item);
        
        resultsInfo.textContent = `Found ${results.length} matches`;
        renderResults(formattedResults);
    });

    // 4. Render Cards
    function renderResults(data) {
        resultsContainer.innerHTML = '';

        if (data.length === 0) {
            resultsContainer.innerHTML = `<p style="text-align:center; color:#64748b;">No events found matching that query.</p>`;
            return;
        }

        data.forEach(event => {
            const card = document.createElement('div');
            // Add severity class for color coding
            card.className = `event-card level-${event.level || 'Info'}`;

            card.innerHTML = `
                <div class="card-header">
                    <span class="event-id">${event.id}</span>
                    <span class="event-source">${event.source} / ${event.category}</span>
                </div>
                <div class="event-desc">${event.description}</div>
                <div class="event-notes">💡 ${event.notes}</div>
                <div class="card-footer">
                    <button class="search-btn" onclick="searchOnline('${event.id}', '${event.description}')">🔗 Search Online</button>
                    <button class="copy-btn" onclick="copyToClipboard('${event.id}')">📋 Copy ID</button>
                </div>
            `;
            resultsContainer.appendChild(card);
        });
    }

    // 5. Search Online Function (Uses free services without API keys)
    window.searchOnline = function(eventId, description) {
        // Create search queries for free resources
        const searches = {
            'Ultimate Windows Security': `https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid=${eventId}`,
            'Microsoft Docs': `https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/audit-${eventId}`,
            'GitHub (Sysmon)': `https://github.com/search?q=${eventId}+sysmon&type=repositories`
        };

        // Open Ultimate Windows Security by default (best source)
        window.open(searches['Ultimate Windows Security'], '_blank');
        
        console.log(`Event ${eventId}: ${description}`);
        console.log('Available resources:', searches);
    };

    // 6. Copy to Clipboard
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert(`Copied: ${text}`);
        });
    };
});
