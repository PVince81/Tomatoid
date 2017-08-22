/*
 *   Copyright 2017 Vincent Petry <pvince81@yahoo.fr>
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


var localStorage = LocalStorage;
var Database = {
	STATE_INCOMPLETE: 0,
	STATE_COMPLETE: 1,

	init: function() {
		console.log('???', localStorage);
		this._db = localStorage.openDatabaseSync("tomatoid_db", "1.0");
		this._db.transaction(
			function(tx) {
				tx.executeSql('CREATE TABLE IF NOT EXISTS tasks(id INT, name TEXT, complete INT, estimate INT, state INT)');
			}
		);
	},

	getDb: function() {
		if (!this._db) {
			this.init();
		}
		return this._db;
	},

	/**
	 * Add task
	 *
	 * @param {String} taskName task name
	 * @param {int} estimate estimate
	 * @param {int} complete complete
	 * @param {int} state 0 incomplete, 1 complete
	 */
	addTask: function(taskName, estimate, complete, state, callback) {
		var rowId = null;
		this.getDb().transaction(
			function(tx) {
				tx.executeSql(
					'INSERT INTO tasks (name, estimate, complete, state) VALUES(?, ?, ?, ?)',
					[ taskName, estimate || 0, complete || 0, state]
				);
				var result = tx.executeSql('SELECT last_insert_rowid()');
				if (typeof(callback) === 'function') {
					callback(result.insertId);
				}
			}
		);
	},

	removeTask: function(taskId, callback) {
		this.getDb().transaction(
			function(tx) {
				tx.executeSql('DELETE FROM tasks WHERE rowid=?', [taskId]);
				if (typeof(callback) === 'function') {
					callback();
				}
			}
		);
	},

	list: function(state, callback) {
		this.getDb().transaction(
			function(tx) {
				var tasks = [];
				var results = tx.executeSql('SELECT * FROM tasks WHERE state=? ORDER BY rowid ASC', [state]);
				for (var i = 0; i < results.rows.length; i++) {
					var row = results.rows[i];
					tasks.push({
						taskId: row.rowid,
						taskName: row.name,
						estimatedPomos: row.estimate,
						donePomos: row.complete,
						state: state
					});
				}
				if (typeof(callback) === 'function') {
					callback(tasks);
				}
			}
		);
	},

	changeState: function(id, newState, callback) {
		this.getDb().transaction(
			function(tx) {
				tx.executeSql('UPDATE tasks SET state=? WHERE rowid=?', [newState, id]);
				if (typeof(callback) === 'function') {
					callback();
				}
			}
		);
	},

	update: function(id, estimate, complete, callback) {
		this.getDb().transaction(
			function(tx) {
				tx.executeSql('UPDATE tasks SET estimate=?, complete=? WHERE rowid=?', [estimate, complete, id]);
				if (typeof(callback) === 'function') {
					callback();
				}
			}
		);
	}
};

