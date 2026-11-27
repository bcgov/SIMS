WITH system_user_data AS (
    SELECT
        id
    FROM
        sims.users
    WHERE
        user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    LIMIT
        1
)
INSERT INTO
    sims.system_lookup_configurations (
        lookup_category,
        lookup_value,
        lookup_key,
        lookup_priority,
        creator
    )
SELECT
    lookup_data.lookup_category,
    lookup_data.lookup_value,
    lookup_data.lookup_key,
    lookup_data.lookup_priority,
    su.id
FROM
    (
        VALUES
            (
                'Underserved community',
                '100 Mile House',
                '100MileHouse',
                1
            ),
            (
                'Underserved community',
                'Ahousat / (Flores Island)',
                'ahousatFloresIsland',
                1
            ),
            (
                'Underserved community',
                'Alert Bay / Namgis First Nation',
                'alertBayNamgisFirstNation',
                1
            ),
            (
                'Underserved community',
                'Alexandria / Alexandria Indian Band / ?Esdilagh',
                'alexandriaAlexandriaIndianBandEsdilagh',
                1
            ),
            (
                'Underserved community',
                'Alexis Creek / Tl''etinqox-T''in Government / Yeneskit''in Government / Yunesti''in',
                'alexisCreekTletinqoxTinGovernmentYeneskitin',
                1
            ),
            (
                'Underserved community',
                'Anahim Lake / Ulkatcho First Nation',
                'anahimLakeUlkatchoFirstNation',
                1
            ),
            (
                'Underserved community',
                'Ashcroft / Cache Creek / Ashcroft Indian Band / Bonaparte Indian Band / Oregon Jack Creek Indian Band',
                'ashcroftCacheCreekAshcroftIndianBandBonaparte',
                1
            ),
            (
                'Underserved community',
                'Atlin / Taku River Tlingit First Nation',
                'atlinTakuRiverTlingitFirstNation',
                1
            ),
            (
                'Underserved community',
                'Balfour / Procter',
                'balfourProcter',
                1
            ),
            (
                'Underserved community',
                'Bamfield / Huu-au-aht First Nation',
                'bamfieldHuuAuAhtFirstNation',
                1
            ),
            (
                'Underserved community',
                'Barriere / Simpcw First Nation / Whispering Pines Indian Band (Clinton Indian Band)',
                'barriereSimpcwFirstNationWhisperingPinesIndianBand',
                1
            ),
            (
                'Underserved community',
                'Bella Bella / Waglisla / Heiltsuk',
                'bellaBellaWaglislaHeiltsuk',
                1
            ),
            (
                'Underserved community',
                'Bella Coola / Nuxalk Nation',
                'bellaCoolaNuxalkNation',
                1
            ),
            (
                'Underserved community',
                'Big White',
                'bigWhite',
                1
            ),
            (
                'Underserved community',
                'Blue River',
                'blueRiver',
                1
            ),
            (
                'Underserved community',
                'Blueberry River First Nation',
                'blueberryRiverFirstNation',
                1
            ),
            (
                'Underserved community',
                'Boston Bar / Boston Bar First Nation / Spuzzum',
                'bostonBarBostonBarFirstNationSpuzzum',
                1
            ),
            (
                'Underserved community',
                'Bridge Lake',
                'bridgeLake',
                1
            ),
            (
                'Underserved community',
                'Burns Lake / Francois Lake',
                'burnsLakeFrancoisLake',
                1
            ),
            (
                'Underserved community',
                'Canal Flats',
                'canalFlats',
                1
            ),
            (
                'Underserved community',
                'Canim Lake / Canim Lake Band',
                'canimLakeCanimLakeBand',
                1
            ),
            (
                'Underserved community',
                'Canoe Creek Band / Dog Creek / Esk''etemc First Nation',
                'canoeCreekBandDogCreekEsketemcFirstNation',
                1
            ),
            (
                'Underserved community',
                'Castlegar',
                'castlegar',
                1
            ),
            (
                'Underserved community',
                'Chase / Scotch Creek / Adams Lake Indian Band / Anglemont / Little Shuswap Indian Band / Neskonlith Indian Band',
                'chaseScotchCreekAdamsLakeIndianBandAnglemontLittle',
                1
            ),
            (
                'Underserved community',
                'Cheslatta',
                'cheslatta',
                1
            ),
            (
                'Underserved community',
                'Chetwynd / Saulteau / Saulteau First Nations',
                'chetwyndSaulteauSaulteauFirstNations',
                1
            ),
            (
                'Underserved community',
                'Christina Lake',
                'christinaLake',
                1
            ),
            (
                'Underserved community',
                'Clearwater',
                'clearwater',
                1
            ),
            (
                'Underserved community',
                'Clinton / Highbar First Nations',
                'clintonHighbarFirstNations',
                1
            ),
            (
                'Underserved community',
                'Cortes Island / Klahoose First Nation',
                'cortesIslandKlahooseFirstNation',
                1
            ),
            (
                'Underserved community',
                'Cranbrook / ?aq''am (St. Mary''s)',
                'cranbrookAqamStMarys',
                1
            ),
            (
                'Underserved community',
                'Crescent Valley',
                'crescentValley',
                1
            ),
            (
                'Underserved community',
                'Creston / Lower Kootenay Band',
                'crestonLowerKootenayBand',
                1
            ),
            (
                'Underserved community',
                'Daajing Giids / Skidegate Band',
                'daajingGiidsSkidegateBand',
                1
            ),
            (
                'Underserved community',
                'Dawson Creek',
                'dawsonCreek',
                1
            ),
            (
                'Underserved community',
                'Dease Lake',
                'deaseLake',
                1
            ),
            (
                'Underserved community',
                'Dease River First Nation',
                'deaseRiverFirstNation',
                1
            ),
            (
                'Underserved community',
                'Doig River',
                'doigRiver',
                1
            ),
            (
                'Underserved community',
                'Edgewood',
                'edgewood',
                1
            ),
            (
                'Underserved community',
                'Elkford',
                'elkford',
                1
            ),
            (
                'Underserved community',
                'Fernie',
                'fernie',
                1
            ),
            (
                'Underserved community',
                'Fort Babine',
                'fortBabine',
                1
            ),
            (
                'Underserved community',
                'Fort Nelson / Fort Nelson First Nation',
                'fortNelsonFortNelsonFirstNation',
                1
            ),
            (
                'Underserved community',
                'Fort St. James / Binche',
                'fortStJamesBinche',
                1
            ),
            (
                'Underserved community',
                'Fort St. John / Taylor',
                'fortStJohnTaylor',
                1
            ),
            (
                'Underserved community',
                'Fort Ware',
                'fortWare',
                1
            ),
            (
                'Underserved community',
                'Fraser Lake',
                'fraserLake',
                1
            ),
            (
                'Underserved community',
                'Galiano Island',
                'galianoIsland',
                1
            ),
            (
                'Underserved community',
                'Gilford Island / Kwikwasut’inuxw Haxwa’mis',
                'gilfordIslandKwikwasutinuxwHaxwamis',
                1
            ),
            (
                'Underserved community',
                'Gold Bridge / Bralorne',
                'goldBridgeBralorne',
                1
            ),
            (
                'Underserved community',
                'Gold River / Mowachaht-Muchalaht First Nation',
                'goldRiverMowachahtMuchalahtFirstNation',
                1
            ),
            (
                'Underserved community',
                'Golden',
                'golden',
                1
            ),
            (
                'Underserved community',
                'Grand Forks',
                'grandForks',
                1
            ),
            (
                'Underserved community',
                'Granisle',
                'granisle',
                1
            ),
            (
                'Underserved community',
                'Grasmere / Tobacco Plains Band',
                'grasmereTobaccoPlainsBand',
                1
            ),
            (
                'Underserved community',
                'Grassy Plains',
                'grassyPlains',
                1
            ),
            (
                'Underserved community',
                'Greenville / Nisga''a Village of Laxgalts''ap',
                'greenvilleNisgaaVillageOfLaxgaltsap',
                1
            ),
            (
                'Underserved community',
                'Greenwood / Midway / Rock Creek / Westbridge',
                'greenwoodMidwayRockCreekWestbridge',
                1
            ),
            (
                'Underserved community',
                'Halfway River',
                'halfwayRiver',
                1
            ),
            (
                'Underserved community',
                'Hartley Bay / Kulkayu / Gitga''at',
                'hartleyBayKulkayuGitgaat',
                1
            ),
            (
                'Underserved community',
                'Hazelton / Gitanmaax Band / Glen Vowell (Sik-e-Dakh) / Hagwilget Village (Tse-kya) / Kispiox Band (Anspayaxw)',
                'hazeltonGitanmaaxBandGlenVowellSikEDakhHagwilget',
                1
            ),
            (
                'Underserved community',
                'Holberg',
                'holberg',
                1
            ),
            (
                'Underserved community',
                'Hornby Island',
                'hornbyIsland',
                1
            ),
            (
                'Underserved community',
                'Hotsprings Cove / Hesquiaht First Nation',
                'hotspringsCoveHesquiahtFirstNation',
                1
            ),
            (
                'Underserved community',
                'Houston',
                'houston',
                1
            ),
            (
                'Underserved community',
                'Hudson''s Hope / West Moberly First Nations',
                'hudsonsHopeWestMoberlyFirstNations',
                1
            ),
            (
                'Underserved community',
                'Invermere / Windermere / ?Akisq''nuk (Akisqnuk) / Shuswap Band',
                'invermereWindermereAkisqnukAkisqnukShuswapBand',
                1
            ),
            (
                'Underserved community',
                'Kaslo',
                'kaslo',
                1
            ),
            (
                'Underserved community',
                'Kelly Lake',
                'kellyLake',
                1
            ),
            (
                'Underserved community',
                'Kimberley',
                'kimberley',
                1
            ),
            (
                'Underserved community',
                'Kincolith / Nisga''a Village of Gingolx',
                'kincolithNisgaaVillageOfGingolx',
                1
            ),
            (
                'Underserved community',
                'Kingcome (Dzawada''enuxw First Nation)',
                'kingcomeDzawadaenuxwFirstNation',
                1
            ),
            (
                'Underserved community',
                'Kitimat / Haisla Nation',
                'kitimatHaislaNation',
                1
            ),
            (
                'Underserved community',
                'Kitkatla / Gitxaala Nation',
                'kitkatlaGitxaalaNation',
                1
            ),
            (
                'Underserved community',
                'Kitsault',
                'kitsault',
                1
            ),
            (
                'Underserved community',
                'Kitwanga (Gitwangak Band) / Gitanyow / Gitsegulka',
                'kitwangaGitwangakBandGitanyowGitsegulka',
                1
            ),
            (
                'Underserved community',
                'Klemtu / Kitasoo Band',
                'klemtuKitasooBand',
                1
            ),
            (
                'Underserved community',
                'Kootenay Bay / Riondel / Crawford Bay',
                'kootenayBayRiondelCrawfordBay',
                1
            ),
            (
                'Underserved community',
                'Kyuquot',
                'kyuquot',
                1
            ),
            (
                'Underserved community',
                'Lasqueti Island',
                'lasquetiIsland',
                1
            ),
            (
                'Underserved community',
                'Lax Kw''alaams (Port Simpson)',
                'laxKwalaamsPortSimpson',
                1
            ),
            (
                'Underserved community',
                'Lhook''uz Dene Nation',
                'lhookuzDeneNation',
                1
            ),
            (
                'Underserved community',
                'Lillooet / Bridge River / Cayoose Creek Indian Band (Sekw''el''was) / Lillooet Indian Band (T''it''q''et) / Xaxli''p First Nation / Xwisten',
                'lillooetBridgeRiverCayooseCreekIndianBandSekwelwas',
                1
            ),
            (
                'Underserved community',
                'Lower Post / Daylu Dena Council (Kaska Dena Council)',
                'lowerPostDayluDenaCouncilKaskaDenaCouncil',
                1
            ),
            (
                'Underserved community',
                'Lytton / Lytton First Nation / Kanaka Bar (T''eqt''''aqtn''mux) / Nicomen Indian Band / Siska Indian Band / Skuppah Indian Band',
                'lyttonLyttonFirstNationKanakaBarTeqtaqtnmuxNicomen',
                1
            ),
            (
                'Underserved community',
                'Mackenzie',
                'mackenzie',
                1
            ),
            (
                'Underserved community',
                'Masset / Old Masset Village Council',
                'massetOldMassetVillageCouncil',
                1
            ),
            (
                'Underserved community',
                'Mayne Island',
                'mayneIsland',
                1
            ),
            (
                'Underserved community',
                'McBride',
                'mcBride',
                1
            ),
            (
                'Underserved community',
                'McLeod Lake Indian Band',
                'mcLeodLakeIndianBand',
                1
            ),
            (
                'Underserved community',
                'Merritt / Coldwater Indian Band / Lower Nicola Indian Band / Upper Nicola Band',
                'merrittColdwaterIndianBandLowerNicolaIndianBand',
                1
            ),
            (
                'Underserved community',
                'Metlakatla',
                'metlakatla',
                1
            ),
            (
                'Underserved community',
                'Middle River',
                'middleRiver',
                1
            ),
            (
                'Underserved community',
                'Miocene',
                'miocene',
                1
            ),
            (
                'Underserved community',
                'Mount Currie',
                'mountCurrie',
                1
            ),
            (
                'Underserved community',
                'Nadleh',
                'nadleh',
                1
            ),
            (
                'Underserved community',
                'Nakusp',
                'nakusp',
                1
            ),
            (
                'Underserved community',
                'Nee Tahi Buhn',
                'neeTahiBuhn',
                1
            ),
            (
                'Underserved community',
                'Nelson',
                'nelson',
                1
            ),
            (
                'Underserved community',
                'Nemaiah Valley / Xeni Gwet''in First Nation Government',
                'nemaiahValleyXeniGwetinFirstNationGovernment',
                1
            ),
            (
                'Underserved community',
                'New Aiyansh (Nisga’a Village of Gitlaxt’aamiks) / Canyon City (Nisga’a Village of Gitwinksihlkw)',
                'newAiyanshNisgaaVillageOfGitlaxtaamiksCanyonCity',
                1
            ),
            (
                'Underserved community',
                'New Denver',
                'newDenver',
                1
            ),
            (
                'Underserved community',
                'Ocean Falls',
                'oceanFalls',
                1
            ),
            (
                'Underserved community',
                'Pavillion / Ts''kw''aylaxw First Nation',
                'pavillionTskwaylaxwFirstNation',
                1
            ),
            (
                'Underserved community',
                'Pender Island',
                'penderIsland',
                1
            ),
            (
                'Underserved community',
                'Port Alice',
                'portAlice',
                1
            ),
            (
                'Underserved community',
                'Port Clements',
                'portClements',
                1
            ),
            (
                'Underserved community',
                'Port Hardy / Gwa''sala-Nakwazda''xw / Kwakiutl First Nation (Kwakwaka''wakw) / Tlatlasikwala First Nation',
                'portHardyGwasalaNakwazdaxwKwakiutlFirstNation',
                1
            ),
            (
                'Underserved community',
                'Port McNeill',
                'portMcNeill',
                1
            ),
            (
                'Underserved community',
                'Port Renfrew / Pacheedaht First Nation',
                'portRenfrewPacheedahtFirstNation',
                1
            ),
            (
                'Underserved community',
                'Prince George / Lheidli Tènneh Nation',
                'princeGeorgeLheidliTennehNation',
                1
            ),
            (
                'Underserved community',
                'Prince Rupert',
                'princeRupert',
                1
            ),
            (
                'Underserved community',
                'Princeton',
                'princeton',
                1
            ),
            (
                'Underserved community',
                'Prophet River First Nation',
                'prophetRiverFirstNation',
                1
            ),
            (
                'Underserved community',
                'Quatsino / Quatsino First Nation',
                'quatsinoQuatsinoFirstNation',
                1
            ),
            (
                'Underserved community',
                'Quesnel',
                'quesnel',
                1
            ),
            (
                'Underserved community',
                'Redstone Reserve',
                'redstoneReserve',
                1
            ),
            (
                'Underserved community',
                'Revelstoke',
                'revelstoke',
                1
            ),
            (
                'Underserved community',
                'Riske Creek / Toosey Band / Tl''esqox',
                'riskeCreekTooseyBandTlesqox',
                1
            ),
            (
                'Underserved community',
                'Rivers Inlet / Oweekeno (Wuikinuxv First Nation)',
                'riversInletOweekenoWuikinuxvFirstNation',
                1
            ),
            (
                'Underserved community',
                'Saik’uz',
                'saikuz',
                1
            ),
            (
                'Underserved community',
                'Salmo',
                'salmo',
                1
            ),
            (
                'Underserved community',
                'Samahquam',
                'samahquam',
                1
            ),
            (
                'Underserved community',
                'Sandspit',
                'sandspit',
                1
            ),
            (
                'Underserved community',
                'Saturna Island',
                'saturnaIsland',
                1
            ),
            (
                'Underserved community',
                'Savary Island',
                'savaryIsland',
                1
            ),
            (
                'Underserved community',
                'Savona / Skeetchestn Indian Band',
                'savonaSkeetchestnIndianBand',
                1
            ),
            (
                'Underserved community',
                'Sayward',
                'sayward',
                1
            ),
            (
                'Underserved community',
                'Seton Portage / Seton Lake / N''Quatqua First Nation / Shalalth / Tsal''alh',
                'setonPortageSetonLakeNQuatquaFirstNationShalalth',
                1
            ),
            (
                'Underserved community',
                'Sirdar',
                'sirdar',
                1
            ),
            (
                'Underserved community',
                'Skatin',
                'skatin',
                1
            ),
            (
                'Underserved community',
                'Skin Tyee',
                'skinTyee',
                1
            ),
            (
                'Underserved community',
                'Slocan Park',
                'slocanPark',
                1
            ),
            (
                'Underserved community',
                'Smithers',
                'smithers',
                1
            ),
            (
                'Underserved community',
                'Sointula',
                'sointula',
                1
            ),
            (
                'Underserved community',
                'Sparwood',
                'sparwood',
                1
            ),
            (
                'Underserved community',
                'Spences Bridge / Cook''s Ferry Indian Band',
                'spencesBridgeCooksFerryIndianBand',
                1
            ),
            (
                'Underserved community',
                'Stellat’en',
                'stellaten',
                1
            ),
            (
                'Underserved community',
                'Stewart',
                'stewart',
                1
            ),
            (
                'Underserved community',
                'Sun Peaks',
                'sunPeaks',
                1
            ),
            (
                'Underserved community',
                'Tachet',
                'tachet',
                1
            ),
            (
                'Underserved community',
                'Tachie',
                'tachie',
                1
            ),
            (
                'Underserved community',
                'Tahsis',
                'tahsis',
                1
            ),
            (
                'Underserved community',
                'Takla Landing / Takla Lake First Nation',
                'taklaLandingTaklaLakeFirstNation',
                1
            ),
            (
                'Underserved community',
                'Tatla Lake / Alexis Creek First Nation (Tsi Del Del)',
                'tatlaLakeAlexisCreekFirstNationTsiDelDel',
                1
            ),
            (
                'Underserved community',
                'Tatlayoko Lake',
                'tatlayokoLake',
                1
            ),
            (
                'Underserved community',
                'Telegraph Creek / Tahltan Band',
                'telegraphCreekTahltanBand',
                1
            ),
            (
                'Underserved community',
                'Terrace / Kitselas First Nation / Kitsumkalum Band',
                'terraceKitselasFirstNationKitsumkalumBand',
                1
            ),
            (
                'Underserved community',
                'Texada Island',
                'texadaIsland',
                1
            ),
            (
                'Underserved community',
                'Tipella (Xa''Xtsa)',
                'tipellaXaXtsa',
                1
            ),
            (
                'Underserved community',
                'Tofino / Tla-O-Qui-Aht First Nations',
                'tofinoTlaOQuiAhtFirstNations',
                1
            ),
            (
                'Underserved community',
                'Trail / Rossland / Fruitvale',
                'trailRosslandFruitvale',
                1
            ),
            (
                'Underserved community',
                'Tsay Keh Dene',
                'tsayKehDene',
                1
            ),
            (
                'Underserved community',
                'Ts’il Kaz Koh (Burns Lake Band)',
                'tsilKazKohBurnsLakeBand',
                1
            ),
            (
                'Underserved community',
                'Tumbler Ridge',
                'tumblerRidge',
                1
            ),
            (
                'Underserved community',
                'Ucluelet / Macoah / Toquaht Nation / Hitacu (Yuułuʔiłʔatḥ)',
                'uclueletMacoahToquahtNationHitacuYuuUIAth',
                1
            ),
            (
                'Underserved community',
                'Valemount',
                'valemount',
                1
            ),
            (
                'Underserved community',
                'Vanderhoof',
                'vanderhoof',
                1
            ),
            (
                'Underserved community',
                'Wardner',
                'wardner',
                1
            ),
            (
                'Underserved community',
                'Wasa',
                'wasa',
                1
            ),
            (
                'Underserved community',
                'Wet’suwet’en (Broman Lake)',
                'wetsuwetenBromanLake',
                1
            ),
            (
                'Underserved community',
                'Williams Lake / Soda Creek Indian Band (Xatsull First Nation)',
                'williamsLakeSodaCreekIndianBandXatsullFirstNation',
                1
            ),
            (
                'Underserved community',
                'Winlaw',
                'winlaw',
                1
            ),
            (
                'Underserved community',
                'Witset (Moricetown)',
                'witsetMoricetown',
                1
            ),
            (
                'Underserved community',
                'Woss',
                'woss',
                1
            ),
            (
                'Underserved community',
                'Woyenne (Lake Babine)',
                'woyenneLakeBabine',
                1
            ),
            (
                'Underserved community',
                'Yekooche',
                'yekooche',
                1
            ),
            (
                'Underserved community',
                'Zeballos / Ehattesaht First Nation / Nuchatlaht Indian Band',
                'zeballosEhattesahtFirstNationNuchatlahtIndianBand',
                1
            )
    ) AS lookup_data(
        lookup_category,
        lookup_value,
        lookup_key,
        lookup_priority
    )
    CROSS JOIN system_user_data su;
