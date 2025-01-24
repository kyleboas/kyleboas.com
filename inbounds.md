<head>
    <title>Infinite Flight Inbound Search</title>
     
    {% if site.tags != "" %}
    {% include collecttags.html %}
    {% endif %}
    
    {% include favicon.html %}
    
    <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0'>

    <!--[if lt IE 9]>
      <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <link rel="stylesheet" type="text/css" href="{{ site.baseurl }}/infiniteflight.css" />
    <link rel="alternate" type="application/rss+xml" title="{{ site.name }} - {{ site.description }}" href="{{ site.baseurl }}/feed" />
  </head>

  <body>
    <div class="container">
        <h1>Search Inbound Infinite Flight Flights</h1>
        
        <div id="activeAtcAirports" style="font-size: 15px;">
        <pre id="atcAirportsList">Fetching data...</pre>
    </div>

        <!-- Search Form -->
        <form id="searchForm" novalidate>
            <input type="text" id="icao" name="icao" placeholder="Enter ICAO" required>
            <button type="submit">Search</button>
        </form>
        
        <div class="nav-container">
        <div class="nav-left">
            <span>Airport</span>
            <!-- Add icons -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 1.5C7.305 3.5 3.5 7.305 3.5 12S7.305 20.5 12 20.5 20.5 16.695 20.5 12 16.695 3.5 12 3.5zm-.01 9.99h4.01v1.5h-4.01v4.01H9.49v-4.01h-4.01v-1.5h4.01v-4.01h1.5v4.01z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 5v2H4v11h16V7h-5V5h6v15H3V5h6z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 2h7v2h-7V2zm-3 0H4v2h6V2zm-8 4h20v16H2V6zm2 2v12h16V8H4z"/></svg>
        </div>
        <div class="nav-right">
            NZAA 125 &nbsp; YSSY 41 &nbsp; KLAX 37<br>
            LSZH 37 &nbsp; EGLL 27 &nbsp; KLAS 35
        </div>
        </div>
        
        <div class="dropdown">
        <button class="dropdown-toggle">Set Defaults ▼</button>
        <div class="dropdown-menu">
            <h2>Set Defaults</h2>
            <input type="number" id="defaultMinHeading" min="0" max="360" placeholder="Minimum e.g., 0">
            <br>
            <input type="number" id="defaultMaxHeading" min="0" max="360" placeholder="Maximum e.g., 360">
            <br>
            <input type="number" id="defaultMinDistance" min="0" placeholder="Minimum e.g., 50">
            <br>
            <input type="number" id="defaultMaxDistance" min="0" placeholder="Maximum e.g., 500">
            <br>
            <button type="button" id="saveDefaultsButton">Save Defaults</button>
        </div>
    </div>

        <!-- Filter Form -->
        <form id="filterForm" style="margin-top: 20px;">
          <div class="HeadingFilter">
            <input type="number" id="minHeading" min="0" max="360" placeholder="Minimum e.g., 0">
            <input type="number" id="maxHeading" min="0" max="360" placeholder="Maximum e.g., 90">
            <button type="button" id="boldHeadingButton">Bold Aircraft</button>
            <button type="button" id="toggleHeadingButton">Hide Aircraft</button>
           </div> 
        <div class="DistanceFilter">
        <input type="number" id="minDistance" min="0" placeholder="Minimum e.g., 50">
        <input type="number" id="maxDistance" min="0" placeholder="Maximum e.g., 500">
        <button type="button" id="applyDistanceFilterButton">Apply Distance Filter</button>
        <button type="button" id="resetDistanceFilterButton">Reset Filter</button>
        </div>
        <button type="button" id="filterHeadingHighlightButton">Enable Highlight by Heading</button>
        </form>
        
        <button id="manualUpdateButton">Update Information</button>
        
        <!-- Secondary Airport Search -->
        <form id="secondarySearchForm" novalidate>
            <input type="text" id="secondaryIcao" name="secondaryIcao" placeholder="Enter Secondary ICAO" required>
            <button type="submit">Add Airport</button>
        </form>
        <!-- Secondary Airport Section -->
        <div id="secondaryAirport">
            <div id="secondaryAirportContainer"></div>
        </div>
        
      <div class="mainAirport" style="display:none;">
        <p class="atisMessage" id="atisMessage" style="display: none;">ATIS: Not fetched yet</p>    
        <p class="controllersList" id="controllersList" style="display: none;">No active ATC.</p>
      </div>

        <button type="button" id="updateButton">Update</button>
        <button type="button" id="stopUpdateButton" style="display: none;">Stop Update</button>
        <span id="countdownTimer" style="display: none;"></span>
        
        <table id="flightsTable">
        <thead>
            <tr>
                <th>Aircraft</th>
                <th>MIN/MAX</th>
                <th>GS/MACH</th>
                <th>HDG/ALT</th>
                <th>NM/ETA</th>
            </tr>
        </thead>
        <tbody>
            <!-- Dynamic rows will be added here -->
        </tbody>
        </table>
    <script src="/js/if-inbound.js"></script>