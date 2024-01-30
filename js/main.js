class StartPage {
	#state = {
		modules: [],
		settings: {},
		backgrounds: [],
		selectedBackground: false
	};
	#modules = {};

	constructor() {
		this.#setEventListeners();

	    let startPageSettings = localStorage.getItem('startPage');
	    if (startPageSettings != null) {
	        this.#state = JSON.parse(startPageSettings);
	    } else {
	        this.#saveSettings();
	    }

		this.#applySettings();
	    this.#modulesInit();
	    setInterval(_ => {
	    	this.#modulesUpdate();
	    },1e3);
	}

	#setEventListeners() {
		$('#showSettings').click(_ => {
			this.#redrawSettings();
			$('#settings').fadeIn(500);
		});
		$('#settings').click(function(e) {
			if (e.target == this) $('#settings').fadeOut(500);
		});

		$('#settings-module-upload').change(_ => {
			let file    = $('#settings-module-upload').get(0).files[0];
			let reader  = new FileReader();

			reader.onloadend = _ => {
				this.#addModule(reader.result);
			}

			if (file) {
				reader.readAsText(file);
			}
		});

		$('#background-uploader').children('input').change(_ => {
			let file    = $('#background-uploader').children('input').get(0).files[0];
			let reader  = new FileReader();

			reader.onloadend = _ => {
				$(`
					<div class="carousel-item active">
						<div class="ratio ratio-16x9">
							<img src="${reader.result}">
						</div>
					</div>
				`).insertBefore($('#background-uploader-wrapper'));
				$('#background-uploader-wrapper').removeClass('active');
				this.#state.backgrounds.push(reader.result);
			}

			if (file) {
				reader.readAsDataURL(file);
			}
		});
		
        $('#search').keyup(function(e) {
            if (e.keyCode == 13) {
                let searchText = $(this).val();
                location.href = 'https://google.com/search?q='+searchText.replace(/\s+?/,'+');
            }
        });
	}

	#saveSettings() {
	    localStorage.setItem('startPage',JSON.stringify(this.#state));
	}

	#applySettings() {
	    this.#state.modules.map(e => {
	  		let m = JSON.parse(localStorage.getItem(e));
	  		this.#modules[e] = eval(m.code);
	    });
	}

	#modulesInit() {
	    Object.keys(this.#modules).map(e => {
	    	try {
	    		eval(localStorage.getItem(e));
	        	this.#modules[e]._init();
	    	} catch(e) {
	    		console.warn(e);
	    	}
	    });
	}

	#modulesUpdate() {
	    Object.keys(this.#modules).map(e => {
	    	try {
	        	this.#modules[e]._update();
	    	} catch(e) {
	    		console.warning(e);
	    	}
	    });
	}

	#addModule(moduleData) {
		let rows = moduleData.split('\n');
		let about = {
			version: '0.0.0',
			description: 'Empty Description',
			title: 'Empty Title'
		};
		for(let row of rows) {
			if (row.substr(0,2) == '//') {
				row = row.substr(2).trim().split(' ');
				if (row[0] != '' && (row[1] != undefined && row[1] != '')) {
					about[row[0]] = row.slice(1).join(' ');
				}
			}
		}

		if (about.package != undefined) {
			if (this.#state.modules.indexOf(about.package) == -1) {
				this.#state.modules.push(about.package);
				localStorage.setItem(about.package,JSON.stringify({
					about: about,
					code: moduleData
				}));

				this.#applySettings();
				this.#saveSettings();
				this.#redrawSettings();
				alert('Module loaded successfully');
			} else {
				alert('This module already exists');
			}
		} else {
			alert('Module name is not defined');
		}
	}

	#removeModule(moduleName,moduleClass) {
		// this.#modules[moduleName] = moduleClass;
	}

	#redrawSettings() {
		let mList = '';
	    this.#state.modules.map(e => {
	  		let m = JSON.parse(localStorage.getItem(e)).about;
	    	mList += `
	    		<div class="col-12">${m.title} | v${m.version}</div>
	    	`;
	    });
	    $('#settings-modules').html(mList);
	}
}
new StartPage();