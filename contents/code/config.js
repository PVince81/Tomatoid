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

var Config = {

	// FIXME: story to local vars for now until
	// we find a way to persist this
	_dummy: {},

	writeConfig: function(configName, data) {
		this._dummy[configName] = data;
	},

	readConfig: function(configName) {
		return this._dummy[configName];
	}
};

