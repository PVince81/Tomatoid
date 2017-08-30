/*
 *   Copyright 2013 Arthur Taborda <arthur.hvt@gmail.com>
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU Library General Public License as
 *   published by the Free Software Foundation; either version 2 or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details
 *
 *   You should have received a copy of the GNU Library General Public
 *   License along with this program; if not, write to the
 *   Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

/* global Config */
/* global Qt */
/* global incompleteTasks */
/* global completeTasks */

Qt.include('../code/database.js');

var test = true;
var testPomodoroDuration = 10;
var testBreakDuration = 5;
var testLongBreakDuration = 20;

function loadData() {
	Database.list(Database.STATE_INCOMPLETE, function(tasks) {
		for(var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			delete(task.state);
			incompleteTasks.append(task);
		}
	});
	Database.list(Database.STATE_COMPLETE, function(tasks) {
		for(var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			delete(task.state);
			completeTasks.append(task);
		}
	});
}

function newTask(taskName, estimatedPomos) {
    var id = randomId();
	var task = {
		"taskId": id,
		"taskName": taskName,
		"donePomos": 0,
		"estimatedPomos": estimatedPomos
	};
    Database.addTask(id, task.taskName, task.estimatedPomos, task.donePomos, Database.STATE_INCOMPLETE, function() {
		incompleteTasks.append(task);
	});
}

function randomId() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function removeTask(id, model) {
	var index = findTaskIndex(model, id);
	Database.removeTask(id, function() {
		model.remove(index);
	});
}

function findTaskIndex(model, id) {
	for(var i = 0; i < model.count; i++) {
		var task = model.get(i);
		if(id === task.taskId) {
			return i;
		}
	}
	return null;
}

function renameTask(id, taskName) {
	var index = findTaskIndex(incompleteTasks, id);

	Database.renameTask(id, taskName, function() {
		model.setProperty(index, "taskName", taskName);
	});
}


function doTask(id) {
	Database.changeState(id, Database.STATE_COMPLETE, function(task) {
		completeTasks.append(task);
		incompleteTasks.remove(task);
	});
}

function undoTask(id) {
	Database.changeState(id, Database.STATE_INCOMPLETE, function(task) {
		incompleteTasks.append(task);
		completeTasks.remove(task);
	});
}

function runCommand(command) {
	if(command){
		var params = command.split(" ");
		var app = params[0];
		params.shift();
		console.log(app);
		console.log(params);
		plasmoid.runCommand(app, params);
	}
}


function startTask(id, taskName) {
	runCommand(tomatoid.actionStartTimer);

	console.log(plasmoid.popupIcon);
	timer.taskId = id;
	timer.taskName = taskName;
	timer.totalSeconds = test ? testPomodoroDuration : pomodoroLength * 60;
	timer.running = true;
	inPomodoro = true;
	inBreak = false;
}


function startBreak() {
	runCommand(tomatoid.actionStartBreak);
	console.log(plasmoid.popupIcon);

	if(completedPomodoros % pomodorosPerLongBreak === 0) {
		timer.totalSeconds = test ? testLongBreakDuration : longBreakLength * 60;
	} else {
		timer.totalSeconds = test ? testBreakDuration : shortBreakLength * 60;
	}
	timer.running = true;
	inPomodoro = false;
	inBreak = true;
}

function endBreak() {
	runCommand(tomatoid.actionEndBreak);

	if(completedPomodoros % pomodorosPerLongBreak === 0) {
		runCommand(tomatoid.actionEndCycle);
	}

	stop();
}


function stop() {
	console.log(plasmoid.popupIcon);

	timer.running = false;
	inPomodoro = false;
	inBreak = false;
	timer.totalSeconds = 0;
}


function completePomodoro(taskId) {
	var index = findTaskIndex(incompleteTasks, taskId);

	var estimate = incompleteTasks.get(index).estimatedPomos;
	var donePomos = incompleteTasks.get(index).donePomos + 1;

	completedPomodoros += 1;

	Database.update(taskId, estimate, donePomos, function() {
		incompleteTasks.setProperty(index, "donePomos", donePomos)
	});
}


function randomString(len) {
	var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var randomString = "";
	for (var i = 0; i < len; i++) {
		var randomPoz = Math.floor(Math.random() * charSet.length);
		randomString += charSet.substring(randomPoz,randomPoz+1);
	}
	return randomString;
}

