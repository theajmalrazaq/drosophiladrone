/**
 * DrosophilaDrone GCS — Google 3D Area Explorer & CesiumJS Photorealistic Digital Twin
 * 
 * User Config:
 * - Location: { lat: 40.74244, lng: -74.006144 } (Chelsea / High Line / Meatpacking District, Manhattan, NYC)
 * - POI: { density: 30, searchRadius: 1000, types: ["restaurant", "bar", "supermarket", "office", "park", "skyscraper"] }
 * - Camera: { speed: 1, orbitType: "dynamic-orbit" }
 */

const USER_CONFIG = {
    location: {
        coordinates: {
            lat: 40.74244,
            lng: -74.006144
        },
        name: "Manhattan Chelsea & High Line, NYC"
    },
    poi: {
        density: 30,
        searchRadius: 1000,
        types: ["restaurant", "bar", "supermarket", "office", "park", "skyscraper"]
    },
    camera: {
        speed: 1.0,
        orbitType: "dynamic-orbit"
    }
};

const NYC_ORIGIN_LAT = USER_CONFIG.location.coordinates.lat;
const NYC_ORIGIN_LNG = USER_CONFIG.location.coordinates.lng;
const NYC_ORIGIN_ALT = 2.0;

// 1000m Search Radius Real-World Urban Landmarks, Highrises & POIs in Chelsea Manhattan
const NYC_URBAN_LANDMARKS = [
    {
        id: 1,
        name: "Chelsea Market & Food Hall",
        lat: 40.74244,
        lng: -74.006144,
        x: 0.0,
        y: 0.0,
        radius: 35.0,
        height: 38.0,
        floors: 9,
        category: "restaurant",
        type_badge: "RESTAURANT",
        desc: "Famous indoor food concourse & culinary market",
        rating: 4.7
    },
    {
        id: 2,
        name: "Pastis French Bistro",
        lat: 40.7398,
        lng: -74.0054,
        x: -293.0,
        y: 62.0,
        radius: 20.0,
        height: 25.0,
        floors: 6,
        category: "restaurant",
        type_badge: "RESTAURANT",
        desc: "Iconic Meatpacking Parisian bistro & sidewalk cafe",
        rating: 4.6
    },
    {
        id: 3,
        name: "Catch NYC Seafood",
        lat: 40.7399,
        lng: -74.0068,
        x: -282.0,
        y: -55.0,
        radius: 22.0,
        height: 32.0,
        floors: 7,
        category: "restaurant",
        type_badge: "RESTAURANT",
        desc: "Multi-level seafood hotspot & rooftop dining",
        rating: 4.5
    },
    {
        id: 4,
        name: "Buddakan Manhattan",
        lat: 40.7421,
        lng: -74.0058,
        x: -38.0,
        y: 29.0,
        radius: 25.0,
        height: 28.0,
        floors: 6,
        category: "restaurant",
        type_badge: "RESTAURANT",
        desc: "Grand opulent Asian banquet hall & lounge",
        rating: 4.6
    },
    {
        id: 5,
        name: "The Standard High Line & Le Bain",
        lat: 40.7409,
        lng: -74.0079,
        x: -171.0,
        y: -148.0,
        radius: 26.0,
        height: 70.0,
        floors: 18,
        category: "bar",
        type_badge: "ROOFTOP BAR",
        desc: "Cantilevered glass hotel & rooftop discotheque",
        rating: 4.5
    },
    {
        id: 6,
        name: "Gansevoort Rooftop Lounge",
        lat: 40.7402,
        lng: -74.0066,
        x: -248.0,
        y: -38.0,
        radius: 22.0,
        height: 52.0,
        floors: 14,
        category: "bar",
        type_badge: "COCKTAIL LOUNGE",
        desc: "Heated rooftop pool bar overlooking Hudson River",
        rating: 4.3
    },
    {
        id: 7,
        name: "Brass Monkey Pub",
        lat: 40.7406,
        lng: -74.0084,
        x: -204.0,
        y: -190.0,
        radius: 20.0,
        height: 24.0,
        floors: 5,
        category: "bar",
        type_badge: "CRAFT PUB",
        desc: "Rustic brick tavern with rooftop beer terrace",
        rating: 4.4
    },
    {
        id: 8,
        name: "Porchlight Cocktails",
        lat: 40.7508,
        lng: -74.0042,
        x: 928.0,
        y: 164.0,
        radius: 24.0,
        height: 30.0,
        floors: 7,
        category: "bar",
        type_badge: "CRAFT BAR",
        desc: "Southern-inspired craft cocktail gathering place",
        rating: 4.6
    },
    {
        id: 9,
        name: "Whole Foods Market Chelsea",
        lat: 40.7442,
        lng: -73.9965,
        x: 196.0,
        y: 812.0,
        radius: 28.0,
        height: 42.0,
        floors: 12,
        category: "supermarket",
        type_badge: "SUPERMARKET",
        desc: "Flagship 7th Avenue organic grocery & cafe",
        rating: 4.4
    },
    {
        id: 10,
        name: "Trader Joe's Chelsea",
        lat: 40.7431,
        lng: -73.9972,
        x: 73.0,
        y: 753.0,
        radius: 25.0,
        height: 35.0,
        floors: 8,
        category: "supermarket",
        type_badge: "SUPERMARKET",
        desc: "Neighborhood grocery market & wine specialty store",
        rating: 4.6
    },
    {
        id: 11,
        name: "Westside Market NYC",
        lat: 40.7408,
        lng: -74.0003,
        x: -182.0,
        y: 492.0,
        radius: 22.0,
        height: 28.0,
        floors: 6,
        category: "supermarket",
        type_badge: "GOURMET GROCER",
        desc: "Family-owned 24/7 gourmet food & deli market",
        rating: 4.5
    },
    {
        id: 12,
        name: "Google New York HQ (111 8th Ave)",
        lat: 40.7408,
        lng: -74.0021,
        x: -182.0,
        y: 340.0,
        radius: 65.0,
        height: 88.0,
        floors: 16,
        category: "office",
        type_badge: "TECH CAMPUS",
        desc: "Google Manhattan engineering HQ (2.9M sq ft)",
        rating: 4.8
    },
    {
        id: 13,
        name: "IAC Building (Frank Gehry)",
        lat: 40.7455,
        lng: -74.0070,
        x: 340.0,
        y: -72.0,
        radius: 28.0,
        height: 45.0,
        floors: 10,
        category: "office",
        type_badge: "ARCHITECTURE",
        desc: "Sculptural Frank Gehry white glass sailboat architecture",
        rating: 4.6
    },
    {
        id: 14,
        name: "Lantern House (Heatherwick)",
        lat: 40.7448,
        lng: -74.0055,
        x: 262.0,
        y: 54.0,
        radius: 24.0,
        height: 75.0,
        floors: 22,
        category: "residential",
        type_badge: "HIGHRISE",
        desc: "Bespoke bay-window luxury tower straddling High Line",
        rating: 4.6
    },
    {
        id: 15,
        name: "Little Island & Pier 54 Park",
        lat: 40.7420,
        lng: -74.0098,
        x: -49.0,
        y: -308.0,
        radius: 42.0,
        height: 22.0,
        floors: 3,
        category: "park",
        type_badge: "PUBLIC PARK",
        desc: "Tulip-shaped floating island park over Hudson River",
        rating: 4.8
    },
    {
        id: 16,
        name: "The High Line Elevated Park",
        lat: 40.7435,
        lng: -74.0075,
        x: 118.0,
        y: -114.0,
        radius: 20.0,
        height: 18.0,
        floors: 2,
        category: "park",
        type_badge: "LINEAR PARK",
        desc: "World-renowned elevated public freight rail park",
        rating: 4.8
    },
    {
        id: 17,
        name: "30 Hudson Yards (The Edge)",
        lat: 40.7500,
        lng: -74.0030,
        x: 840.0,
        y: 265.0,
        radius: 45.0,
        height: 387.0,
        floors: 103,
        category: "skyscraper",
        type_badge: "SKYSCRAPER",
        desc: "Supertall skyscraper with highest open skydeck in NYC",
        rating: 4.9
    },
    {
        id: 18,
        name: "Chelsea Piers Sports Complex",
        lat: 40.7465,
        lng: -74.0095,
        x: 450.0,
        y: -280.0,
        radius: 40.0,
        height: 30.0,
        floors: 5,
        category: "park",
        type_badge: "SPORTS PIER",
        desc: "28-acre waterfront sports & entertainment village",
        rating: 4.7
    }
];

function metersToCoords(x, y) {
    const lat = NYC_ORIGIN_LAT + (x / 111111.0);
    const lng = NYC_ORIGIN_LNG + (y / (111111.0 * Math.cos((NYC_ORIGIN_LAT * Math.PI) / 180.0)));
    return [lng, lat];
}

function coordsToMeters(lng, lat) {
    const x = (lat - NYC_ORIGIN_LAT) * 111111.0;
    const y = (lng - NYC_ORIGIN_LNG) * (111111.0 * Math.cos((NYC_ORIGIN_LAT * Math.PI) / 180.0));
    return [x, y];
}

class Drone3DVisualizer {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);

        // Flight & Drone State
        this.dronePos = [0.0, 0.0, 1.5]; // [X, Y, Z]
        this.droneVel = [0.0, 0.0, 0.0];
        this.droneEuler = [0.0, 0.0, 0.0]; // [roll, pitch, yaw]
        this.targetPos = [5.0, 0.0, 1.5];
        this.currentAirframe = "quad_x";
        this.currentEngine = "satellite"; // Default to Satellite so map is ALWAYS bright & immediate
        this.followDrone = false;

        // Dynamic-Orbit Camera Controller (Config: speed=1, orbitType="dynamic-orbit")
        this.isAutoOrbiting = true; // Auto-Orbit enabled by default per config
        this.orbitSpeed = USER_CONFIG.camera.speed || 1.0;
        this.orbitType = USER_CONFIG.camera.orbitType || "dynamic-orbit";
        this.orbitHeading = 0.0;
        this.orbitBasePitch = -28.0;
        this.orbitBaseDistance = 420.0;
        this.orbitTime = 0.0;
        this.orbitCenter = null;
        this.orbitListener = null;

        // Entities & Collections
        this.trailHistory = [];
        this.maxTrailPoints = 500;
        this.viewer = null;
        this.droneEntity = null;
        this.trailEntity = null;
        this.targetEntity = null;
        this.targetLineEntity = null;
        this.googleTileset = null;
        this.osmBuildingsTileset = null;
        this.landmarkEntities = new Map();

        // Callbacks
        this.onTargetSelected = null;

        this.initCesium();
    }

    initCesium() {
        if (typeof Cesium === "undefined") {
            console.error("CesiumJS script not loaded! Retrying in 500ms...");
            setTimeout(() => this.initCesium(), 500);
            return;
        }

        if (!this.container) {
            this.container = document.getElementById(this.containerId);
            if (!this.container) return;
        }

        try {
            // Check for saved Google API Key
            const savedGoogleKey = localStorage.getItem("google_maps_3d_api_key");
            if (savedGoogleKey) {
                Cesium.GoogleMaps.defaultApiKey = savedGoogleKey;
            }

            // Create High-Resolution Base Satellite Layer (Esri World Imagery)
            const esriBaseLayer = new Cesium.ImageryLayer(
                new Cesium.UrlTemplateImageryProvider({
                    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    maximumLevel: 19,
                    credit: "Esri World Imagery"
                })
            );

            // Create Cesium Viewer with clean UI & robust imagery
            this.viewer = new Cesium.Viewer(this.containerId, {
                animation: false,
                timeline: false,
                baseLayerPicker: false,
                geocoder: false,
                homeButton: false,
                infoBox: false,
                sceneModePicker: false,
                selectionIndicator: false,
                navigationHelpButton: false,
                navigationInstructionsInitiallyVisible: false,
                fullscreenButton: false,
                vrButton: false,
                shadows: false,
                skyAtmosphere: new Cesium.SkyAtmosphere(),
                baseLayer: esriBaseLayer,
                contextOptions: {
                    webgl: {
                        preserveDrawingBuffer: true,
                        alpha: true
                    }
                }
            });
        } catch (e) {
            console.error("Error creating Cesium.Viewer:", e);
            return;
        }

        // Clean default overlays
        this.cleanViewerUI();

        // Setup Bright Daylight Atmosphere & Ambient Lighting (Manhattan is ALWAYS sunlit!)
        this.setupAtmosphereAndLighting();

        // Load 3D Tiles Engine (ArcGIS Satellite 3D + 3D Buildings)
        this.load3DTilesEngine(this.currentEngine);

        // Setup 3D Manhattan Landmark Hologram Towers & Rings
        this.setupNewYorkLandmarks();

        // Setup 3D Drone Entity (Holybro X500 / Tactical)
        this.setupDroneEntity();

        // Setup Glowing Trajectory Trail
        this.setupTrailEntity();

        // Setup Target Waypoint Entity
        this.setupTargetEntity();

        // Setup Click-to-Fly Raycasting
        this.setupClickHandler();

        // Initial Manhattan Chelsea Skyline Perspective
        this.centerOnHome(0.0);

        // Start Dynamic Orbit per user config
        if (this.isAutoOrbiting) {
            this.startDynamicOrbit();
        }
    }

    cleanViewerUI() {
        if (this.viewer && this.viewer.cesiumWidget && this.viewer.cesiumWidget.creditContainer) {
            this.viewer.cesiumWidget.creditContainer.style.display = "none";
        }
        if (this.viewer && this.viewer.bottomContainer) {
            this.viewer.bottomContainer.style.display = "none";
        }
    }

    setupAtmosphereAndLighting() {
        if (!this.viewer) return;
        const scene = this.viewer.scene;

        // Lock time to sunny 2:00 PM afternoon in New York (daylight)
        this.viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date("2026-06-21T18:00:00Z"));
        this.viewer.clock.shouldAnimate = false;

        // Keep globe lighting disabled so satellite textures are vibrant, crystal clear and bright
        scene.globe.enableLighting = false;
        scene.globe.showGroundAtmosphere = true;
        scene.globe.show = true;
        scene.fog.enabled = true;
        scene.fog.density = 0.00012;
        scene.fog.screenSpaceErrorFactor = 2.0;

        if (scene.skyAtmosphere) {
            scene.skyAtmosphere.show = true;
            scene.skyAtmosphere.brightnessShift = 0.2;
            scene.skyAtmosphere.saturationShift = 0.15;
        }
    }

    async load3DTilesEngine(engineType = "satellite") {
        this.currentEngine = engineType;
        if (!this.viewer) return;

        // 1. Clean up existing Google 3D Tileset if any
        if (this.googleTileset) {
            try {
                this.viewer.scene.primitives.remove(this.googleTileset);
            } catch (e) {}
            this.googleTileset = null;
        }

        const savedKey = localStorage.getItem("google_maps_3d_api_key");

        // 2. If Google Photorealistic 3D is selected and key is available
        if (engineType === "google_3d" && savedKey) {
            try {
                Cesium.GoogleMaps.defaultApiKey = savedKey;
                if (typeof Cesium.createGooglePhotorealistic3DTileset === "function") {
                    this.googleTileset = await Cesium.createGooglePhotorealistic3DTileset({
                        key: savedKey
                    });
                    this.viewer.scene.primitives.add(this.googleTileset);
                    this.viewer.scene.globe.show = false;
                    console.log("[Google 3D Tiles] Google Photorealistic 3D Tiles loaded successfully!");
                    return;
                }
            } catch (e) {
                console.warn("[Google 3D Tiles] Falling back to satellite imagery:", e);
                this.viewer.scene.globe.show = true;
            }
        }

        // 3. Robust Base Satellite Imagery (Globe is ALWAYS visible)
        this.viewer.scene.globe.show = true;
        this.viewer.imageryLayers.removeAll();

        // Photorealistic Satellite (Esri High-Resolution World Imagery)
        const provider = new Cesium.UrlTemplateImageryProvider({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            maximumLevel: 19,
            credit: "Esri World Imagery"
        });

        this.viewer.imageryLayers.addImageryProvider(provider);
        await this.loadOsmBuildings();
    }

    async loadOsmBuildings() {
        if (this.osmBuildingsTileset || !this.viewer) return;
        try {
            if (typeof Cesium.createOsmBuildingsAsync === "function") {
                this.osmBuildingsTileset = await Cesium.createOsmBuildingsAsync({
                    style: new Cesium.Cesium3DTileStyle({
                        color: {
                            conditions: [
                                ["${feature['building']} === 'commercial'", "color('rgba(0, 240, 255, 0.45)')"],
                                ["${feature['building']} === 'apartments'", "color('rgba(255, 170, 0, 0.45)')"],
                                ["true", "color('rgba(50, 80, 120, 0.55)')"]
                            ]
                        }
                    })
                });
                this.viewer.scene.primitives.add(this.osmBuildingsTileset);
            }
        } catch (e) {
            console.log("[OSM Buildings] Procedural landmark geometry active.");
        }
    }

    setupNewYorkLandmarks() {
        if (!this.viewer) return;

        NYC_URBAN_LANDMARKS.forEach((lm) => {
            const centerCart = Cesium.Cartesian3.fromDegrees(
                lm.lng,
                lm.lat,
                lm.height / 2.0
            );
            const topCart = Cesium.Cartesian3.fromDegrees(
                lm.lng,
                lm.lat,
                lm.height + 14.0
            );

            // 1. 3D Volumetric Tower Cylinder
            const towerEntity = this.viewer.entities.add({
                name: lm.name,
                position: centerCart,
                cylinder: {
                    length: lm.height,
                    topRadius: lm.radius * 0.9,
                    bottomRadius: lm.radius,
                    material: Cesium.Color.fromCssColorString("rgba(0, 240, 255, 0.22)"),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString("rgba(0, 240, 255, 0.75)"),
                    outlineWidth: 2
                }
            });

            // 2. Base Hazard Warning Ring
            const ringEntity = this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lm.lng, lm.lat, 2.0),
                ellipse: {
                    semiMinorAxis: lm.radius + 10.0,
                    semiMajorAxis: lm.radius + 10.0,
                    material: Cesium.Color.fromCssColorString("rgba(255, 51, 102, 0.12)"),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString("rgba(255, 51, 102, 0.6)"),
                    outlineWidth: 2
                }
            });

            // 3. 3D Billboard Pin Label (Clean & Legible)
            const labelEntity = this.viewer.entities.add({
                position: topCart,
                label: {
                    text: `${lm.name}\n${lm.height}M • RATE: ${lm.rating} [${lm.category.toUpperCase()}]`,
                    font: "10px 'Departure Mono', monospace",
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    fillColor: Cesium.Color.fromCssColorString("#ffffff"),
                    outlineColor: Cesium.Color.fromCssColorString("#080c10"),
                    outlineWidth: 3,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -12),
                    scaleByDistance: new Cesium.NearFarScalar(100, 1.0, 3000, 0.65),
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3500)
                },
                point: {
                    pixelSize: 8,
                    color: Cesium.Color.fromCssColorString("#00f0ff"),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2
                }
            });

            this.landmarkEntities.set(lm.id, {
                tower: towerEntity,
                ring: ringEntity,
                label: labelEntity,
                data: lm
            });
        });
    }

    getDroneCartesian() {
        const [lng, lat] = metersToCoords(this.dronePos[0], this.dronePos[1]);
        const alt = Math.max(0.5, this.dronePos[2]) + NYC_ORIGIN_ALT;
        return Cesium.Cartesian3.fromDegrees(lng, lat, alt);
    }

    setupDroneEntity() {
        if (!this.viewer) return;
        if (this.droneEntity) {
            this.viewer.entities.remove(this.droneEntity);
        }

        const modelUri = this.currentAirframe === "quad_x" ? "/static/models/quad_x.gltf" : "/static/models/drone.glb";
        const initialPos = this.getDroneCartesian();
        const hpr = new Cesium.HeadingPitchRoll(0, 0, 0);
        const initialQuat = Cesium.Transforms.headingPitchRollQuaternion(initialPos, hpr);

        this.droneEntity = this.viewer.entities.add({
            name: "DrosophilaDrone Quadcopter",
            position: initialPos,
            orientation: initialQuat,
            model: {
                uri: modelUri,
                minimumPixelSize: 64,
                maximumScale: 80,
                scale: this.currentAirframe === "quad_x" ? 3.0 : 3.5,
                runAnimations: true
            },
            point: {
                pixelSize: 8,
                color: Cesium.Color.fromCssColorString("#00f0ff"),
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            }
        });

        this.trailHistory = [initialPos];
    }

    setupTrailEntity() {
        if (!this.viewer) return;
        if (this.trailEntity) {
            this.viewer.entities.remove(this.trailEntity);
        }

        this.trailEntity = this.viewer.entities.add({
            polyline: {
                positions: new Cesium.CallbackProperty(() => this.trailHistory, false),
                width: 4.0,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.35,
                    color: Cesium.Color.fromCssColorString("#00f0ff")
                })
            }
        });
    }

    setupTargetEntity() {
        if (!this.viewer) return;

        const [tLng, tLat] = metersToCoords(this.targetPos[0], this.targetPos[1]);
        const tAlt = Math.max(0.5, this.targetPos[2]) + NYC_ORIGIN_ALT;
        const targetCart = Cesium.Cartesian3.fromDegrees(tLng, tLat, tAlt);

        this.targetEntity = this.viewer.entities.add({
            name: "Target Waypoint Beacon",
            position: targetCart,
            cylinder: {
                length: 2.5,
                topRadius: 1.8,
                bottomRadius: 0.1,
                material: Cesium.Color.fromCssColorString("rgba(0, 255, 136, 0.75)"),
                outline: true,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: "TARGET WAYPOINT",
                font: "10px 'Departure Mono', monospace",
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.fromCssColorString("#00ff88"),
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -18)
            }
        });

        this.targetLineEntity = this.viewer.entities.add({
            polyline: {
                positions: new Cesium.CallbackProperty(() => {
                    const [lng, lat] = metersToCoords(this.targetPos[0], this.targetPos[1]);
                    const alt = Math.max(0.5, this.targetPos[2]) + NYC_ORIGIN_ALT;
                    return [
                        Cesium.Cartesian3.fromDegrees(lng, lat, NYC_ORIGIN_ALT),
                        Cesium.Cartesian3.fromDegrees(lng, lat, alt)
                    ];
                }, false),
                width: 3,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.4,
                    color: Cesium.Color.fromCssColorString("#00ff88")
                })
            }
        });
    }

    setupClickHandler() {
        if (!this.viewer) return;
        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

        handler.setInputAction((click) => {
            const ray = this.viewer.camera.getPickRay(click.position);
            const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene) || 
                              this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);

            if (cartesian) {
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const lng = Cesium.Math.toDegrees(cartographic.longitude);
                const lat = Cesium.Math.toDegrees(cartographic.latitude);

                const [x, y] = coordsToMeters(lng, lat);
                const targetZ = this.targetPos[2] || 1.5;

                const roundedX = Math.round(x * 10) / 10;
                const roundedY = Math.round(y * 10) / 10;
                const roundedZ = Math.round(targetZ * 10) / 10;

                this.updateTarget([roundedX, roundedY, roundedZ]);

                if (this.onTargetSelected) {
                    this.onTargetSelected(roundedX, roundedY, roundedZ);
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    updateTelemetry(data) {
        if (!data) return;

        if (data.position && data.position.length >= 3) {
            this.dronePos = [data.position[0], data.position[1], data.position[2]];
        }
        if (data.velocity && data.velocity.length >= 3) {
            this.droneVel = [data.velocity[0], data.velocity[1], data.velocity[2]];
        }
        if (data.euler && data.euler.length >= 3) {
            this.droneEuler = [data.euler[0], data.euler[1], data.euler[2]];
        }
        if (data.target_position && data.target_position.length >= 3) {
            this.targetPos = [data.target_position[0], data.target_position[1], data.target_position[2]];
        }

        const droneCart = this.getDroneCartesian();
        const roll = this.droneEuler[0] || 0;
        const pitch = this.droneEuler[1] || 0;
        const yaw = this.droneEuler[2] || 0;
        const heading = Cesium.Math.toRadians(Cesium.Math.toDegrees(yaw));
        const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
        const orientationQuat = Cesium.Transforms.headingPitchRollQuaternion(droneCart, hpr);

        if (this.droneEntity) {
            this.droneEntity.position = droneCart;
            this.droneEntity.orientation = orientationQuat;
        }

        this.trailHistory.push(droneCart);
        if (this.trailHistory.length > this.maxTrailPoints) {
            this.trailHistory.shift();
        }

        this.updateAttitudeHorizon(this.droneEuler);
        this.updateLandmarkProximities();

        // Follow Drone Camera update (if not auto-orbiting)
        if (this.followDrone && !this.isAutoOrbiting && this.viewer) {
            this.viewer.camera.lookAt(
                droneCart,
                new Cesium.HeadingPitchRange(
                    Cesium.Math.toRadians(Cesium.Math.toDegrees(this.droneEuler[2] || 0) - 90),
                    Cesium.Math.toRadians(-25),
                    65.0
                )
            );
        }
    }

    updateLandmarkProximities() {
        NYC_URBAN_LANDMARKS.forEach((lm) => {
            const entityObj = this.landmarkEntities.get(lm.id);
            if (!entityObj || !entityObj.tower) return;

            const dx = lm.x - this.dronePos[0];
            const dy = lm.y - this.dronePos[1];
            const dist = Math.hypot(dx, dy);

            const warningDist = lm.radius + 20.0;
            if (dist < warningDist && this.dronePos[2] <= lm.height) {
                entityObj.tower.cylinder.material = Cesium.Color.fromCssColorString("rgba(255, 51, 102, 0.45)");
                entityObj.tower.cylinder.outlineColor = Cesium.Color.fromCssColorString("#ff3366");
            } else if (dist < warningDist + 40.0) {
                entityObj.tower.cylinder.material = Cesium.Color.fromCssColorString("rgba(245, 158, 11, 0.3)");
                entityObj.tower.cylinder.outlineColor = Cesium.Color.fromCssColorString("#f59e0b");
            } else {
                entityObj.tower.cylinder.material = Cesium.Color.fromCssColorString("rgba(0, 240, 255, 0.22)");
                entityObj.tower.cylinder.outlineColor = Cesium.Color.fromCssColorString("rgba(0, 240, 255, 0.75)");
            }
        });
    }

    updateAttitudeHorizon(euler) {
        const horizon = document.getElementById("attitudeHorizon");
        const headingText = document.getElementById("attitudeHeadingVal");
        if (!horizon) return;

        const rollDeg = ((euler[0] || 0) * 180) / Math.PI;
        const pitchDeg = ((euler[1] || 0) * 180) / Math.PI;
        const yawDeg = ((euler[2] || 0) * 180) / Math.PI;

        const clampedPitch = Math.max(-45, Math.min(45, pitchDeg));
        const pitchPx = (clampedPitch / 45) * 40;

        horizon.setAttribute(
            "transform",
            `rotate(${-rollDeg.toFixed(1)}, 90, 90) translate(0, ${pitchPx.toFixed(1)})`
        );

        if (headingText) {
            const normalizedHeading = ((yawDeg % 360) + 360) % 360;
            headingText.textContent = `${Math.round(normalizedHeading).toString().padStart(3, "0")}°`;
        }
    }

    updateTarget(pos) {
        if (!pos) return;
        this.targetPos = [pos[0], pos[1], pos[2]];

        if (this.targetEntity) {
            const [tLng, tLat] = metersToCoords(this.targetPos[0], this.targetPos[1]);
            const tAlt = Math.max(0.5, this.targetPos[2]) + NYC_ORIGIN_ALT;
            this.targetEntity.position = Cesium.Cartesian3.fromDegrees(tLng, tLat, tAlt);
        }
    }

    resetTrail() {
        const initialPos = this.getDroneCartesian();
        this.trailHistory = [initialPos];
    }

    // =========================================================================
    // Dynamic-Orbit Camera Engine (Config: speed=1, orbitType="dynamic-orbit")
    // =========================================================================

    toggleAutoOrbit(forceState = null) {
        const targetState = forceState !== null ? forceState : !this.isAutoOrbiting;
        if (targetState) {
            this.startDynamicOrbit();
        } else {
            this.stopAutoOrbit();
        }
        return this.isAutoOrbiting;
    }

    startDynamicOrbit(centerCartesian = null, distance = 420.0) {
        if (!this.viewer) return;
        this.isAutoOrbiting = true;
        this.orbitHeading = this.viewer.camera.heading || 0.0;
        this.orbitBaseDistance = distance;
        this.orbitCenter = centerCartesian || Cesium.Cartesian3.fromDegrees(NYC_ORIGIN_LNG, NYC_ORIGIN_LAT, 25.0);
        this.orbitTime = 0.0;

        if (this.orbitListener) {
            this.viewer.clock.onTick.removeEventListener(this.orbitListener);
        }

        this.orbitListener = () => {
            if (!this.isAutoOrbiting || !this.viewer) return;
            this.orbitTime += 0.016 * this.orbitSpeed;
            
            // Dynamic Heading advance (smooth 360° rotation)
            this.orbitHeading += 0.0025 * this.orbitSpeed;
            if (this.orbitHeading > Cesium.Math.TWO_PI) {
                this.orbitHeading -= Cesium.Math.TWO_PI;
            }

            // Dynamic Pitch oscillation (-24° to -32°)
            const dynamicPitchDeg = this.orbitBasePitch + Math.sin(this.orbitTime * 0.4) * 4.0;
            const dynamicPitch = Cesium.Math.toRadians(dynamicPitchDeg);

            // Dynamic Distance breathing (390m to 450m)
            const dynamicDistance = this.orbitBaseDistance + Math.cos(this.orbitTime * 0.3) * 35.0;

            const center = this.followDrone ? this.getDroneCartesian() : this.orbitCenter;
            this.viewer.camera.lookAt(
                center,
                new Cesium.HeadingPitchRange(this.orbitHeading, dynamicPitch, dynamicDistance)
            );
        };

        this.viewer.clock.onTick.addEventListener(this.orbitListener);
    }

    stopAutoOrbit() {
        this.isAutoOrbiting = false;
        if (this.orbitListener && this.viewer) {
            this.viewer.clock.onTick.removeEventListener(this.orbitListener);
            this.orbitListener = null;
            this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        }
    }

    zoomIn() {
        if (!this.viewer) return;
        if (this.isAutoOrbiting) {
            this.orbitBaseDistance = Math.max(80.0, this.orbitBaseDistance * 0.75);
            return;
        }
        this.viewer.camera.zoomIn(this.viewer.camera.positionCartographic.height * 0.35);
    }

    zoomOut() {
        if (!this.viewer) return;
        if (this.isAutoOrbiting) {
            this.orbitBaseDistance = Math.min(2500.0, this.orbitBaseDistance * 1.35);
            return;
        }
        this.viewer.camera.zoomOut(this.viewer.camera.positionCartographic.height * 0.45);
    }

    toggleFollowDrone() {
        this.followDrone = !this.followDrone;
        if (!this.followDrone && this.viewer && !this.isAutoOrbiting) {
            this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        }
        return this.followDrone;
    }

    centerOnDrone() {
        if (!this.viewer) return;
        if (this.isAutoOrbiting) {
            this.stopAutoOrbit();
        }

        const [lng, lat] = metersToCoords(this.dronePos[0], this.dronePos[1]);
        const alt = Math.max(0.5, this.dronePos[2]) + NYC_ORIGIN_ALT;

        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                lng,
                lat - 0.0008,
                alt + 85.0
            ),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-35),
                roll: 0.0
            },
            duration: 1.5
        });
    }

    centerOnHome(duration = 1.5) {
        if (!this.viewer) return;
        if (this.isAutoOrbiting) {
            this.stopAutoOrbit();
        }

        // Manhattan Chelsea / High Line Skyline Overview (Google 3D Area Explorer Style)
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                NYC_ORIGIN_LNG - 0.0015,
                NYC_ORIGIN_LAT - 0.0040,
                380.0
            ),
            orientation: {
                heading: Cesium.Math.toRadians(18.0),
                pitch: Cesium.Math.toRadians(-28.0),
                roll: 0.0
            },
            duration: duration
        });
    }

    flyToLandmark(landmarkId) {
        const lm = NYC_URBAN_LANDMARKS.find(item => item.id === landmarkId);
        if (!lm || !this.viewer) return;

        if (this.isAutoOrbiting) {
            this.stopAutoOrbit();
        }

        const landmarkCart = Cesium.Cartesian3.fromDegrees(lm.lng, lm.lat, lm.height * 0.5);

        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                lm.lng - 0.0015,
                lm.lat - 0.0022,
                lm.height + 80.0
            ),
            orientation: {
                heading: Cesium.Math.toRadians(25.0),
                pitch: Cesium.Math.toRadians(-24.0),
                roll: 0.0
            },
            duration: 1.8,
            complete: () => {
                const switchEl = document.getElementById("toggle-auto-orbit");
                if (switchEl && switchEl.checked) {
                    this.startDynamicOrbit(landmarkCart, lm.height + 110.0);
                }
            }
        });
    }
}

// Export global instance
window.Drone3DVisualizer = Drone3DVisualizer;
