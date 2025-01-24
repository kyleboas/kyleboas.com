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
        <div class="nav-container">
    <div class="nav-left">
        <input 
            type="text" 
            id="icao" 
            name="icao" 
            placeholder="Airport" 
            style="width: 40px; border: none; margin-right: -10px;"
        />
                <button style="background-color: #ffffff; color: #828282;">
                    <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                </button>
                <button style="background-color: #ffffff; color: #828282; margin-left: -25px;">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i>
                </button>
                <button style="background-color: #ffffff; color: #828282; margin-left: -20px;">
                    <i class="fa-solid fa-sliders" aria-hidden="true"></i>
                </button>
                <button style="background-color: #ffffff; color: #828282; margin-left: -30px;">
                    <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
                </button>
            </div>
            <div class="nav-right" style="font-size: 12px; display: none;">
                NZAA 125   YSSY 41   KLAX 37<br>
                LSZH 37   EGLL 27   KLAS 35
            </div>
        </div>
        
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
</body> 