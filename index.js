const { app, BrowserWindow, Menu, ipcMain } = require('electron');
var path = require('path');

const fs = require('fs');



/**
 * configuration
 */
const configurations = () => { 
	process.env.NODE_ENV = 'production';
}
configurations();

/**
 * Application 
 */
const mainWindow = () => {
	let win = new BrowserWindow({
		width: 1000,
		height: 800,
		title:'WP TODO by Aavoya'
	});


	let lastConnectedFile = null;
	try{
		lastConnectedFile = path.join(__dirname,'/jsons/lastConnect.json');
		if(lastConnectedFile.search('app.asar')){
			lastConnectedFile = lastConnectedFile.replace('app.asar','');
		}
		
		 lastConnectedFile = fs.readFileSync(lastConnectedFile, 'utf8');
		 
	}
	
	catch (err){
		console.log(err);
		return;
	}

	lastConnectedFile = JSON.parse(lastConnectedFile);

	
	if (lastConnectedFile.length != 0 && process.env.NODE_ENV != 'development') {
		win.loadURL(lastConnectedFile[0].url);
	}else{
		
		win.loadFile(path.join(__dirname,'/welcome.html'));
	}
	


	



	/**
	 * Quit the App and its child process on close button
	 */
	win.on('closed', () => {
		app.quit();
	});


	return win;
	
}

/**
 * Application Menu
 */
const  appMenuStatic = () => {

	/**
	 * Main Items
	 * Array of Objects
	 */
	let menuTemplate = [{
		label: 'Server',
		submenu: [
			{
			label: 'Add',
			click() {
				addServer();
				}
			}
		]
	}]
	
	
	/**
	 * add Server list if exists
	 */
	let servers = populateServerList();
	if (servers) {
		menuTemplate[0].submenu.push(servers);
	}

	/**
	 * Mac Menu workaround to remove 'electron' menu item.
	 * pushing empty object
	 */
	if (process.platform == 'darwin') {
		menuTemplate.unshift({});	
	}

	/**
	 * Developer Mode 
	 */
	 if (process.env.NODE_ENV !== 'production') {
		menuTemplate.push({
			label: 'Developer Mode',
			submenu: [{
				label: 'Toggle Developer Mode',
				click(item, focusedWindow) {
					focusedWindow.toggleDevTools();
				}
			}]
		});
	}
	

	/**
	 * buildFromTemplate : constructor function 
	 * @param {Array of Objects } menuTemplate
	 * @return {Object}  mainMenu
	 */
	let mainMenuObject = Menu.buildFromTemplate(menuTemplate);


	/**
	* Finally Creating the Menu
 	* @param {Object} 
	*/
	Menu.setApplicationMenu(mainMenuObject);

	
}
/**
 * Add Server Dialog Box
 */
const addServer = () => { 
	
	let serverWin = new BrowserWindow({
		width: 550,
		height: 270,
		resizable: false,
		minimizable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
		modal: true,
		parent: win
	});
	
	/**
	 * This will prevent the dialog box having same menu as the main window
	 * only works on window(win32) and Linux platforms
	 */
	if (serverWin) {
		if (process.platform != 'darwin' ) { 
			serverWin.setMenu(null);
		}
	}

	serverWin.loadFile(path.join(__dirname,'/addServer.html'));

	ipcMain.on('addServer', (e, item) => {
		if (!item[0] && !item[1]) {
			serverWin.close();
			return;
		}
	
		let label = item[0];
		let url = item[1];
		let id = 0
		var data = null
		try {
			server = path.join(__dirname,'/jsons/server.json');
			if(server.search('app.asar')){
				server.replace('app.asar','');
			}
			 data = fs.readFileSync(server, 'utf8')
			
		}
		catch (err){
			console.log(err);
			return;
		}
		
		

		data = JSON.parse(data);
		/**
		 * it checks if the file having any data or not
		 */
		if (data.length != 0) {
			id = data[data.length - 1].id + 1;
		}
		data.push({ "id": id, "label": label, "url": url });

		serverWrite = path.join(__dirname,'/jsons/server.json');
		if(serverWrite.search('app.asar')){
			serverWrite = serverWrite.replace('app.asar','');
		}

		fs.writeFileSync(serverWrite, JSON.stringify(data), 'utf8');

		serverWin.close();
		Menu.setApplicationMenu(null);
		appMenuStatic();
	});

}



/**
 * populate server list on the menu
 */
const populateServerList = () => {
	var serverFile = null
	try {
		serverFile = path.join(__dirname,'/jsons/server.json');
		if(serverFile.search('app.asar')){
			serverFile = serverFile.replace('app.asar','');
		}
		serverFile = fs.readFileSync(serverFile, 'utf8');			
	}
	catch(err){
		console.log(err);
		return;
	}

	serverFile = JSON.parse(serverFile);

	if (serverFile.length == 0) {
		return;
	}
	
	let subMenu = [];

	for (let i = 0; i < serverFile.length; i++){
		
		subMenu.push({ "label": serverFile[i].label, click() { loadAppUrl(serverFile[i].url)} });
		
	}

	let menuObject = {
		label: 'Connect',
		submenu: subMenu
	}

	return menuObject;
}

const loadAppUrl = (url) => {


	lc= [{url}];
	lcf = path.join(__dirname,'/jsons/lastConnect.json');
	if(lcf.search('app.asar')){
			lcf = lcf.replace('app.asar','');
	}
	fs.writeFileSync(lcf, JSON.stringify(lc), 'utf8');
	

	win.loadURL(url);
}



/**
 * Initializing Main Application on Ready State
 */
app.whenReady().then(() => {
	
	win = mainWindow();
	appMenuStatic();
	
});
 
