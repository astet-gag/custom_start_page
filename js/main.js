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

	#memory = class {
		#moduleName = '';
		constructor(moduleName) {
			this.#moduleName = moduleName;
		}

		set(varName,value) {
			let mem = JSON.parse(localStorage.getItem(this.#moduleName+'Mem'));
			mem[varName] = value;
			localStorage.setItem(this.#moduleName+'Mem',JSON.stringify(mem));

			return value;
		}
		
		get(varName) {
			let mem = localStorage.getItem(this.#moduleName+'Mem');
			if (mem !== null) {
				mem = JSON.parse(mem);
				if (mem[varName] !== undefined) {
					return mem[varName];
				} else {
					return undefined;
				}
			} else {
				return undefined;
			}
		}
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
		$('body').on('removeModule', (_,mn) => {
			this.#removeModule(mn);
		});

		$('#background-uploader').children('input').change(_ => {
			let file    = $('#background-uploader').children('input').get(0).files[0];
			let reader  = new FileReader();

			reader.onloadend = _ => {
				$(`
					<div class="carousel-item active">
						<div style="--upload-bg: url(${reader.result})"></div>
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

	#container = {
		get: (size,styled=true) => {
			if (/^[1,2]$/.test(size)) {
				let c = $(`<div class="col-${size == 1 ? 6 : 12}">
					<div class="extension-panel ${styled ? 'styled' : ''}"></div>
				</div>`).appendTo($('#extension-panels'));
				return $(c).children('.extension-panel');
			} else {
				return false;
			}
		}
	}

	#moduleInit(e) {
		let m = this.#modules[e];
		let styles = m._module.styles != undefined ? `<style>${m._module.styles}</style>` : '';
		$('head').append(styles);
		
		m._memory = new this.#memory(e);
		m._container = this.#container;

		m._init();
	}

	#modulesInit() {
	    Object.keys(this.#modules).map(e => {
	    	try {
				this.#moduleInit(e);
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
				localStorage.setItem(pack+'Mem','{}');

				this.#saveSettings();

				this.#modules[pack] = eval(moduleData);
				this.#moduleInit(pack);
				
				this.#redrawSettings();
			} else {
				alert('This module already exists');
			}
		} else {
			alert('Module name is not defined');
		}
	}

	#removeModule(moduleName) {
		let moduleIndex = this.#state.modules.indexOf(moduleName);
		if (moduleIndex > -1) {
			this.#state.modules.splice(moduleIndex,1);

			delete this.#modules[moduleName];

			localStorage.removeItem(moduleName);
			localStorage.removeItem(moduleName+'Mem');
			
			this.#saveSettings();
			alert('Module removed successfully');
			location.reload();
		} else {
			alert(`Module with package name "${moduleName}" not found`);
		}
	}

	#redrawSettings() {
		let mList = '';

		$('#background-uploader-wrapper').addClass('active').siblings().remove();
		this.#state.backgrounds.map(e => {
			$(`
				<div class="carousel-item">
					<div style="--upload-bg: url(${e})"></div>
				</div>
			`).insertBefore($('#background-uploader-wrapper'));
		});

	    Object.keys(this.#modules).map(e => {
			let m = this.#modules[e];
	    	mList += `
	    		<div class="col-12">
					<span>${m._module.title} | v${m._module.version}</span>
					<span class="material-symbols-outlined" onclick="$(this).trigger('removeModule','${e}')">delete_forever</span>
				</div>
	    	`;
	    });
	    $('#settings-modules').html(mList);
	}
}
new StartPage();