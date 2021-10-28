// Written by Jonah Meggs 2021
init();

let nodes = [];
let available = new Array(1000);
for (let i = 0; i < 1000; i++) {
	available[i] = new Array(1000).fill(0);
}
let xFill = [];
let yFill = [];

let selected = null;
let directed = false;
let list = false;
let nextNode = 0;
let rendered = [];
let bfs_code = [
'void breadthFirst(Graph g, Vertex src) {',
'	int *visited = calloc(g->nV, sizeof(int));',
'	Queue q = QueueNew();',
'	QueueEnqueue(q, src);',
'	while (!QueueIsEmpty(q)) {',
'		Vertex v = QueueDequeue(q);',
'		if (visited[v]) {',
'			continue;',
'		}',
'		visited[v] = 1;',
'		printf("%d\\n", v);',
'		for (Vertex w = 0; w < g->nV; w++) {',
'			if (g->edges[v][w] && !visited[w]) {',
'				QueueEnqueue(q, w);',
'			}',
'		}',
'	}',
'	QueueFree(q);',
'	free(visited);',
'}'
];

let dfs_code = [
'void depthFirst(Graph g, Vertex src) {',
'	int *visited = calloc(g->nV, sizeof(int));',
'	Stack s = StackNew();',
'	StackPush(s, src);',
'	while (!StackIsEmpty(s)) {',
'		Vertex v = StackPop(s);',
'		if (visited[v]) {',
'			continue;',
'		}',
'		visited[v] = 1;',
'		printf("%d\\n", v);',
'		for (Vertex w = g->nV - 1; w >= 0; w--) {',
'			if (g->edges[v][w] && !visited[w]) {',
'				StackPush(s, w);',
'			}',
'		}',
'	}',
'	StackFree(s);',
'	free(visited);',
'}'
];
let bfs_lines = [];
let dfs_lines = [];

function init() {
	if (document.readyState === 'complete') {
		// nodes.push(document.getElementById('node-0'));
		// nodes.push(document.getElementById('node-1'));
		// nodes.push(document.getElementById('node-2'));
		// nodes.push(document.getElementById('node-3'));
		// nodes.push(document.getElementById('node-4'));
		// nodes.forEach(node => {node.addEventListener('click', selectNode)});
		// nodes[0].style.left = "75vw";
		// nodes[0].style.top = "50vh";
		createCircleFill();
		// fillCircle(500, 500);
		// spread(nodes);
		document.getElementById('directed-button').addEventListener('click', setDirected);
		document.getElementById('undirected-button').addEventListener('click', setUndirected);
		document.getElementById('matrix-button').addEventListener('click', setMatrix);
		document.getElementById('list-button').addEventListener('click', setList);
		document.getElementById('graph-container').addEventListener('click', createNode);
		initGraph(nextNode);
		let matrix_tbl = document.getElementById('adjacency-matrix');
		for (let i = 0; i < nextNode; i++) {
			for (let j = 0; j < nextNode; j++) {
				matrix_tbl.rows[i+1].cells[j+1].innerHTML = '-1';
				matrix_tbl.rows[i+1].cells[j+1].style.color = 'grey';
			}
		}
		document.getElementById('bfs-start').addEventListener('click', startBFS);
		document.getElementById('bfs-next').addEventListener('click', nextBFS);
		document.getElementById('bfs-next').disabled = true;
		document.getElementById('bfs-reset').addEventListener('click', resetBFS);
		document.getElementById('bfs-reset').disabled = true;
		let bfs_code_container = document.getElementById('bfs-code-container');
		bfs_code.forEach(line => {
			let p = document.createElement('p');
			p.innerHTML = line;
			bfs_lines.push(p);
			bfs_code_container.appendChild(p);
		});
		document.getElementById('dfs-start').addEventListener('click', startDFS);
		document.getElementById('dfs-next').addEventListener('click', nextDFS);
		document.getElementById('dfs-next').disabled = true;
		document.getElementById('dfs-reset').addEventListener('click', resetDFS);
		document.getElementById('dfs-reset').disabled = true;
		let dfs_code_container = document.getElementById('dfs-code-container');
		dfs_code.forEach(line => {
			let p = document.createElement('p');
			p.innerHTML = line;
			dfs_lines.push(p);
			dfs_code_container.appendChild(p);
		});
		document.getElementById('bfs-button').addEventListener('click', showBFS);
		document.getElementById('dfs-button').addEventListener('click', showDFS);
		alert('Click somewhere in the middle panel to place a node! (and make edges by clicking 2 nodes consecutively!)')
		return;
	}
	setTimeout(init, 100);
}

function createNode(event) {
	if (bfs_running || dfs_running) {
		alert('You cant change the graph while the algo is running :( - try resetting the algo first.');
		return;
	}
	let n = document.createElement('div');
	n.classList.add('node');
	n.id = 'node-'+nextNode;
	n.style.left = event.clientX-20+'px';
	n.style.top = event.clientY-20+'px';
	n.innerHTML = nextNode;
	n.addEventListener('click', selectNode);
	document.getElementById('graph-container').appendChild(n);
	nodes.push(n);
	insertNode(nextNode);
	// Update matrix
	let matrix_tbl = document.getElementById('adjacency-matrix');
	let th = document.createElement('th');
	th.innerHTML = ''+nextNode;
	matrix_tbl.rows[0].appendChild(th);
	for (let i = 0; i < nextNode; i++) {
		let td = document.createElement('td');
		td.innerHTML = '-1';
		td.style.color = 'grey';
		matrix_tbl.rows[i+1].appendChild(td);
	}
	let tr = document.createElement('tr');
	th = document.createElement('th');
	th.innerHTML = ''+nextNode;
	tr.appendChild(th);
	for (let i = 0; i <= nextNode; i++) {
		let td = document.createElement('td');
		td.innerHTML = '-1';
		td.style.color = 'grey';
		tr.appendChild(td);
	}
	matrix_tbl.appendChild(tr);
	// Update list
	let list_tbl = document.getElementById('adjacency-list');
	tr = document.createElement('tr');
	th = document.createElement('th');
	th.innerHTML = ''+nextNode;
	let td = document.createElement('td');
	tr.appendChild(th);
	tr.appendChild(td);
	list_tbl.appendChild(tr);
	nextNode++;
}

function spread(nodes, rand) {
	for (let i = 0; i < nodes.length; i++) {
		for (let j = i+1; j < nodes.length; j++) {
			let dist = Math.sqrt(Math.pow(nodes[i].offsetLeft - nodes[j].offsetLeft, 2) + Math.pow(nodes[i].offsetTop - nodes[j].offsetTop, 2));
			if (dist < 60) {
				if (nodes[j].style.left === '') {
					console.log(j);
					let direction = Math.random()*2*Math.PI;
					relocate(nodes[j], direction);
					// printAvailable();
				}
			}
		}
	}
}

function createCircleFill() {
	let radius = 100;
	for (let i = -radius; i <= radius; i++) {
		for (let j = -radius; j <= radius; j++) {
			if (Math.sqrt(Math.pow(i, 2) + Math.pow(j, 2)) <= radius) {
				xFill.push(i);
				yFill.push(j);
				// console.log(i, j);
			}
		}
	}
}

function fillCircle(x, y) {
	for (let i = 0; i < xFill.length; i++) {
		// if (xFill[i] >50 || xFill[i] < -50) console.log("eeekkk");
		available[x+xFill[i]][y+yFill[i]]++;
	}
}

function printAvailable() {
	let line = '';
	for (let i = 0; i < 20; i++) {
		for (let j = 0; j < 20; j++) {
			line += available[i*50][j*50];
		}
		line += '\n';
	}
	console.log(line);
}

function relocate(node, direction) {
	let x, y;
	for (let i = 0; i < 500; i++) {
		x = Math.floor(Math.sin(direction)*i);
		y = Math.floor(Math.cos(direction)*i);
		if (!available[500+x][500+y]) {
			console.log(500+x, 500+y, direction);
			fillCircle(500+x, 500+y);
			node.style.left = (50+(500+x)/20)+"vw";
			node.style.top = ((500+y)/10)+"vh";
			return;
		}
		// console.log("\tnot available", 500+x, 500+y);
	}
	console.log("hmmm", direction);
}

function selectNode(event) {
	if (bfs_running || dfs_running) {
		event.stopPropagation();
		alert('You cant change the graph while the algo is running :( - try resetting the algo first.');
		return;
	}
	if (selected == this) {
		selected.style.boxShadow = 'none';
		selected = null;
	} else if (selected == null) {
		selected = this;
		this.style.boxShadow = '0px 0px 15px 5px rgba(128, 128, 255, .75)';
	} else {
		if (!containsEdge(parseInt(selected.innerHTML), parseInt(this.innerHTML))) drawLine(selected, this);
		selected.style.boxShadow = 'none';
		selected = null;
	}
	event.stopPropagation();
}

function drawLine(a, b) {
	const graph = document.getElementById('graph-container');
	if (!directed || (directed && !containsEdge(parseInt(b.innerHTML), parseInt(a.innerHTML)))) {
		let line = document.createElement('div');
		line.style.height = '0px';
		line.style.width = Math.sqrt(Math.pow(a.offsetLeft - b.offsetLeft, 2) + Math.pow(a.offsetTop - b.offsetTop, 2))+'px';
		line.style.borderTop = '2px solid black';
		line.style.zIndex = '0'
		line.style.transformOrigin = "0% 0%";
		line.style.transform = `rotate(${Math.atan((a.offsetTop - b.offsetTop)/(a.offsetLeft - b.offsetLeft))*180/Math.PI}deg)`;
		// console.log(a.style.left);
		if (a.offsetLeft <= b.offsetLeft) line.style.left = (parseInt(window.getComputedStyle(a, null).getPropertyValue("left").slice(0,-2))+20)+'px';
		else line.style.left = (parseInt(window.getComputedStyle(b, null).getPropertyValue("left").slice(0,-2))+20)+'px';
		if (a.offsetLeft <= b.offsetLeft) line.style.top = (parseInt(window.getComputedStyle(a, null).getPropertyValue("top").slice(0,-2))+20)+'px';
		else line.style.top = (parseInt(window.getComputedStyle(b, null).getPropertyValue("top").slice(0,-2))+20)+'px';
		line.style.position = 'absolute';
		rendered.push(line);
		graph.appendChild(line);
	}
	if (directed) {
		let arrow = document.createElement('div');
		arrow.classList.add('arrow-container');
		let left = document.createElement('div');
		left.classList.add('arrow-left');
		let right = document.createElement('div');
		right.classList.add('arrow-right');
		arrow.appendChild(left);
		arrow.appendChild(right);
		arrow.style.transformOrigin = "50% 0%";
		arrow.style.transform = `rotate(${Math.atan((a.offsetTop - b.offsetTop)/(a.offsetLeft - b.offsetLeft))*180/Math.PI+90+(b.offsetLeft<a.offsetLeft?180:0)}deg)`;
		// center of b, shifted by 20*cos(angle)
		let l = b.offsetLeft + 20-6 - 20*Math.cos(Math.atan((a.offsetTop - b.offsetTop)/(a.offsetLeft - b.offsetLeft))+(b.offsetLeft<a.offsetLeft?Math.PI:0));
		arrow.style.left = l+'px';
		let r = b.offsetTop + 20 - 20*Math.sin(Math.atan((a.offsetTop - b.offsetTop)/(a.offsetLeft - b.offsetLeft))+(b.offsetLeft<a.offsetLeft?Math.PI:0));
		arrow.style.top = r+'px';
		console.log(l-b.offsetLeft-20, r-b.offsetTop-20);
		rendered.push(arrow);
		graph.appendChild(arrow);
	}
	const matrix_tbl = document.getElementById('adjacency-matrix');
	const list_tbl = document.getElementById('adjacency-list');
	// console.log(tbl.rows[1].cells[1]);
	// console.log(a.value)
	insertEdge(parseInt(a.innerHTML), parseInt(b.innerHTML), directed);

	matrix_tbl.rows[parseInt(a.innerHTML)+1].cells[parseInt(b.innerHTML)+1].innerHTML = '1'; 
	matrix_tbl.rows[parseInt(a.innerHTML)+1].cells[parseInt(b.innerHTML)+1].style.color = 'black'; 
	list_tbl.rows[parseInt(a.innerHTML)].cells[1].innerHTML += ' -> ' + b.innerHTML;
	if (!directed) {
		matrix_tbl.rows[parseInt(b.innerHTML)+1].cells[parseInt(a.innerHTML)+1].innerHTML = '1';
		matrix_tbl.rows[parseInt(b.innerHTML)+1].cells[parseInt(a.innerHTML)+1].style.color = 'black'; 
		list_tbl.rows[parseInt(b.innerHTML)].cells[1].innerHTML += ' -> ' + a.innerHTML;
	}
}

function reset() {
	rendered.forEach(thing => {thing.parentNode.removeChild(thing);});
	rendered = [];
	nodes.forEach(thing => {thing.parentNode.removeChild(thing);});
	nodes = [];
	let matrix_tbl = document.getElementById('adjacency-matrix');
	let list_tbl = document.getElementById('adjacency-list');
	let inputContainer = matrix_tbl.parentNode;
	matrix_tbl.parentNode.removeChild(matrix_tbl);
	list_tbl.parentNode.removeChild(list_tbl);
	matrix_tbl = document.createElement('table');
	matrix_tbl.id = 'adjacency-matrix';
	let tr = document.createElement('tr');
	let th = document.createElement('th');
	tr.appendChild(th);
	matrix_tbl.appendChild(tr);
	inputContainer.appendChild(matrix_tbl);
	list_tbl = document.createElement('table');
	list_tbl.id = 'adjacency-list';
	inputContainer.appendChild(list_tbl);
	initGraph(0);
	nextNode = 0;

}

function setDirected(event) {
	if (bfs_running || dfs_running) {
		alert('You cant change the graph while the algo is running :( - try resetting the algo first.');
		return;
	}
	if (directed) return;
	directed = true;
	this.style.backgroundColor = 'white'
	document.getElementById('undirected-button').style.backgroundColor = '#F0F0F0';
	reset();
}

function setUndirected(event) {
	if (bfs_running || dfs_running) {
		alert('You cant change the graph while the algo is running :( - try resetting the algo first.');
		return;
	}
	if (!directed) return;
	directed = false;
	this.style.backgroundColor = 'white'
	document.getElementById('directed-button').style.backgroundColor = '#F0F0F0';
	reset();
}

function setMatrix(event) {
	if (!list) return;
	list = false;
	this.style.backgroundColor = 'white'
	document.getElementById('list-button').style.backgroundColor = '#F0F0F0';
	// Display matrix rep
	document.getElementById('adjacency-list').style.display = 'none';
	document.getElementById('adjacency-matrix').style.display = 'block';
}

function setList(event) {
	if (list) return;
	list = true;
	this.style.backgroundColor = 'white'
	document.getElementById('matrix-button').style.backgroundColor = '#F0F0F0';
	// Display list rep
	document.getElementById('adjacency-matrix').style.display = 'none';
	document.getElementById('adjacency-list').style.display = 'block';
}

/*****************************
******************************

BFS STUFF

******************************
*****************************/

let bfs_line = 0;
let bfs_q = [];
let bfs_source = 0;
let bfs_v = -1;
let bfs_visited;
let bfs_w = -1;
let bfs_running = false;

function showBFS(event) {
	if (dfs_running) resetDFS();
	let dfs_button = document.getElementById('dfs-button');
	let dfs = document.getElementById('dfs');
	let bfs = document.getElementById('bfs');
	dfs_button.style.backgroundColor = '#F0F0F0';
	dfs.style.display = 'none';
	this.style.backgroundColor = 'white';
	bfs.style.display = 'flex';
}

function startBFS(event) {
	const sourceText = document.getElementById('bfs-source').value;
	if (sourceText === undefined || sourceText === '') {
		alert("Source is not a valid node :(");
		return;
	}
	bfs_source = parseInt(sourceText);
	if (bfs_source < 0 || bfs_source >= nextNode) {
		alert("Source is not a valid node :(");
		return;
	}
	document.getElementById('bfs-source').disabled = true;
	document.getElementById('bfs-next').disabled = false;
	document.getElementById('bfs-reset').disabled = false;
	bfs_line = 1;
	bfs_lines[bfs_line].style.backgroundColor = "yellow";
	bfs_visited = [];
	for (let i = 0; i < nextNode; i++) {
		bfs_visited.push(0);
	}
	bfs_running = true;
	bfs_v = -1;
}

function nextBFS(event) {
	bfs_lines[bfs_line].style.backgroundColor = "whitesmoke";
	if (bfs_line === 1 || bfs_line === 2 || bfs_line === 8 || bfs_line === 17) {
		bfs_line++;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 3) {
		bfs_q.push(bfs_source);
		document.getElementById('bfs-q').innerHTML += `${bfs_source}\n`;
		bfs_line++;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 4) {
		if (bfs_q.length === 0) {
			bfs_line = 17;
		} else {
			bfs_line++;
		}
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 5) {
		if (bfs_v !== -1) nodes[bfs_v].style.boxShadow = '0px 0px 15px 5px rgba(255, 0, 0, .75)';
		bfs_v = bfs_q.shift();
		nodes[bfs_v].style.boxShadow = '0px 0px 15px 5px rgba(0, 255, 0, .75)';
		let tmp = document.getElementById('bfs-q').innerHTML;
		const s = tmp.indexOf("\n");
		document.getElementById('bfs-q').innerHTML = tmp.slice(s+1);
		bfs_line++;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 6) {
		if (bfs_visited[bfs_v]) bfs_line++;
		else bfs_line += 3;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 7) {
		bfs_line = 4;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 9) {
		bfs_visited[bfs_v] = 1;
		bfs_line++;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 10) {
		document.getElementById('bfs-terminal').innerHTML += `${bfs_v}\n`;
		bfs_line++;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 11) {
		if (bfs_w === -1) bfs_w = 0;
		else bfs_w++;
		if (bfs_w >= nextNode) {
			bfs_w = -1;
			bfs_line = 4;
		} else {
			bfs_line++;
		}
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 12) {
		if (containsEdge(bfs_v, bfs_w) && !bfs_visited[bfs_w]) bfs_line++;
		else bfs_line--;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 13) {
		bfs_q.push(bfs_w);
		document.getElementById('bfs-q').innerHTML += `${bfs_w}\n`;
		nodes[bfs_w].style.boxShadow = '0px 0px 15px 5px rgba(0, 0, 255, .75)';
		bfs_line = 11;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 18) {
		document.getElementById('bfs-next').disabled = true;
	}
}

function resetBFS(event) {
	document.getElementById('bfs-source').disabled = false;
	document.getElementById('bfs-next').disabled = true;
	document.getElementById('bfs-reset').disabled = true;
	bfs_running = false;
	bfs_lines[bfs_line].style.backgroundColor = "whitesmoke";
	for (let i = 0; i < nextNode; i++) {
		nodes[i].style.boxShadow = 'none';
	}
	document.getElementById('bfs-terminal').innerHTML = '';
	document.getElementById('bfs-q').innerHTML = '';
}


/*****************************
******************************

DFS STUFF

******************************
*****************************/

let dfs_line = 0;
let dfs_s = [];
let dfs_source = 0;
let dfs_v = -1;
let dfs_visited;
let dfs_w = nextNode;
let dfs_running = false;

function showDFS(event) {
	if (bfs_running) resetBFS();
	let bfs_button = document.getElementById('bfs-button');
	let bfs = document.getElementById('bfs');
	let dfs = document.getElementById('dfs');
	bfs_button.style.backgroundColor = '#F0F0F0';
	bfs.style.display = 'none';
	this.style.backgroundColor = 'white';
	dfs.style.display = 'flex';
}

function startDFS(event) {
	const sourceText = document.getElementById('dfs-source').value;
	if (sourceText === undefined || sourceText === '') {
		alert("Source is not a valid node :(");
		return;
	}
	dfs_source = parseInt(sourceText);
	if (dfs_source < 0 || dfs_source >= nextNode) {
		alert("Source is not a valid node :(");
		return;
	}
	document.getElementById('dfs-source').disabled = true;
	document.getElementById('dfs-next').disabled = false;
	document.getElementById('dfs-reset').disabled = false;
	dfs_line = 1;
	dfs_lines[dfs_line].style.backgroundColor = "yellow";
	dfs_visited = [];
	for (let i = 0; i < nextNode; i++) {
		dfs_visited.push(0);
	}
	dfs_running = true;
	dfs_v = -1;
	dfs_w = nextNode;
}

function nextDFS(event) {
	dfs_lines[dfs_line].style.backgroundColor = "whitesmoke";
	if (dfs_line === 1 || dfs_line === 2 || dfs_line === 8 || dfs_line === 17) {
		dfs_line++;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 3) {
		dfs_s.push(dfs_source);
		document.getElementById('dfs-q').innerHTML += `${dfs_source}\n`;
		dfs_line++;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 4) {
		if (dfs_s.length === 0) {
			dfs_line = 17;
		} else {
			dfs_line++;
		}
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 5) {
		if (dfs_v !== -1) nodes[dfs_v].style.boxShadow = '0px 0px 15px 5px rgba(255, 0, 0, .75)';
		dfs_v = dfs_s.pop();
		nodes[dfs_v].style.boxShadow = '0px 0px 15px 5px rgba(0, 255, 0, .75)';
		let tmp = document.getElementById('dfs-q').innerHTML;
		const s = tmp.slice(0,-1).lastIndexOf("\n");
		document.getElementById('dfs-q').innerHTML = tmp.slice(0,(s===-1?0:s+1));
		dfs_line++;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 6) {
		if (dfs_visited[dfs_v]) dfs_line++;
		else dfs_line += 3;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 7) {
		dfs_line = 4;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 9) {
		dfs_visited[dfs_v] = 1;
		dfs_line++;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 10) {
		document.getElementById('dfs-terminal').innerHTML += `${dfs_v}\n`;
		dfs_line++;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 11) {
		if (dfs_w === nextNode) dfs_w = nextNode-1;
		else dfs_w--;
		if (dfs_w < 0) {
			dfs_w = nextNode;
			dfs_line = 4;
		} else {
			dfs_line++;
		}
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 12) {
		if (containsEdge(dfs_v, dfs_w) && !dfs_visited[dfs_w]) dfs_line++;
		else dfs_line--;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 13) {
		dfs_s.push(dfs_w);
		document.getElementById('dfs-q').innerHTML += `${dfs_w}\n`;
		nodes[dfs_w].style.boxShadow = '0px 0px 15px 5px rgba(0, 0, 255, .75)';
		dfs_line = 11;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 18) {
		document.getElementById('dfs-next').disabled = true;
	}
}

function resetDFS(event) {
	document.getElementById('dfs-source').disabled = false;
	document.getElementById('dfs-next').disabled = true;
	document.getElementById('dfs-reset').disabled = true;
	dfs_running = false;
	dfs_lines[dfs_line].style.backgroundColor = "whitesmoke";
	for (let i = 0; i < nextNode; i++) {
		nodes[i].style.boxShadow = 'none';
	}
	document.getElementById('dfs-terminal').innerHTML = '';
	document.getElementById('dfs-q').innerHTML = '';
}



/*****************************
******************************

GRAPH STUFF

******************************
*****************************/

let m = [];
let l = [];

function initGraph(n) {
	m = [];
	l = [];
	for (let i = 0; i < n; i++) {
		m.push([-1, -1, -1, -1, -1]);
		l.push([]);
	}
}

function insertNode(num) {
	m.forEach(row => {row.push(-1);});
	let tmp = [];
	for (let i = 0; i <= num; i++) tmp.push(-1);
	m.push(tmp);
	l.push([]);
}

function insertEdge(from, to, directed) {
	m[from][to] = '1';
	l[from].push(to);
	if (!directed) {
		m[to][from] = '1';
		l[to].push(from);
	}
}

function containsEdge(from, to) {
	return m[from][to] !== -1;
}