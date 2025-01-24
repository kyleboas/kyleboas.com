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
    <script src="https://kit.fontawesome.com/dff461b9f7.js" crossorigin="anonymous"></script>
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
        <input type="text" id="icao" name="icao" placeholder="Airport">
        <button><i class="fa-solid fa-magnifying-glass"></i></button>
        <button><i class="fa-solid fa-plus"></i></button>
        <button><i class="fa-solid fa-sliders"></i></button>
        <button><i class="fa-solid fa-arrows-rotate"></i></button>
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