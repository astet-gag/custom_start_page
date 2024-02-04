class StartPage {
	#state = {
		modules: [],
		settings: {},
		backgrounds: [],
		selectedBackground: false
	};
	#modules = {};
	#screenResolutin = {};

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
		this.#updateScreenResolution();
	}

	#updateScreenResolution() {
		this.#screenResolutin = {
			x: $('body').width(),
			y: $('body').height()
		};

		$('style#dynamic-styles').text(`
			:root {
				--screenW: ${this.#screenResolutin.x};
				--screenH: ${this.#screenResolutin.y};
			}
		`);
	}

	#setEventListeners() {
		$(window).on('resize', _ => {
			this.#updateScreenResolution();
		});

		$('#showSettings').click(_ => {
			this.#redrawSettings();
			$('#settings').fadeIn(500);

			let res = this.#screenResolutin;
			$('#recomended-resolution').children('span').text(res.x+'x'+res.y);
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
						<div>
							<img src="${reader.result}">
						</div>
					</div>
				`).insertBefore($('#background-uploader-wrapper'));
				$('#background-uploader-wrapper').removeClass('active');

				this.#state.backgrounds.push(reader.result);
				if (this.#state.selectedBackground === false) this.#state.selectedBackground = 0;
				this.#saveSettings();
				this.#applySettings();
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

		$('#next-bg').click(_ => {
			let selBg = this.#state.selectedBackground;
			if (selBg !== false) {
				selBg = selBg == this.#state.backgrounds.length - 1 ? 0 : selBg + 1;
				this.#state.selectedBackground = selBg;
				this.#saveSettings();
				this.#applySettings();
			}
		});
		$('#prev-bg').click(_ => {
			let selBg = this.#state.selectedBackground;
			if (selBg !== false) {
				selBg = selBg == 0 ? this.#state.backgrounds.length - 1 : selBg - 1;
				this.#state.selectedBackground = selBg;
				this.#saveSettings();
				this.#applySettings();
			}
		});
	}

	#saveSettings() {
	    localStorage.setItem('startPage',JSON.stringify(this.#state));
	}

	#applySettings() {
		if (this.#state.selectedBackground !== false) {
			$('body').css('--bg','url('+this.#state.backgrounds[this.#state.selectedBackground]+')');
		}

	    this.#state.modules.map(e => {
	  		let m = localStorage.getItem(e);
	  		this.#modules[e] = eval(m);
	    });
	}

	#modulesInit() {
	    Object.keys(this.#modules).map(e => {
	    	try {
				let m = this.#modules[e];
	        	m._init();
				if (m._styles != undefined) {
					$('head').append('<style>'+m._styles+'</style>');
				}

				if (m.width != undefined) {
					let c = $(`<div class="col-${m.width == 1 ? 6 : 12}">
						<div class="extention-panel"></div>
					</div>`).appendTo($('#extention-panels'));
					this.#modules[e]._container = $(c).children();
				}
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
	    		console.warn(e);
	    	}
	    });
	}

	#addModule(moduleData) {
		let pack = moduleData.split('\n')[0];
		if (/^\/\/\spackage\s[a-z\d\_\-]+$/.test(pack)) {
			pack = pack.substr(2).trim().split(' ')[1];
		}

		if (pack != undefined) {
			if (this.#state.modules.indexOf(pack) == -1) {
				this.#state.modules.push(pack);
				localStorage.setItem(pack,moduleData);

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

		$('#background-uploader-wrapper').addClass('active').siblings().remove();
		this.#state.backgrounds.map(e => {
			$(`
				<div class="carousel-item">
					<div>
						<img src="${e}">
					</div>
				</div>
			`).insertBefore($('#background-uploader-wrapper'));
		});

	    Object.keys(this.#modules).map(e => {
			let m = this.#modules[e];
	    	mList += `
	    		<div class="col-12">${m._module.title} | v${m._module.version}</div>
	    	`;
	    });
	    $('#settings-modules').html(mList);
	}
}
new StartPage();