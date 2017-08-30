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

import QtQuick 2.0
import QtMultimedia 5.8
import org.kde.plasma.components 2.0 as PlasmaComponents
import org.kde.plasma.core 2.0 as PlasmaCore
import QtQuick.Layouts 1.1
import QtQuick.LocalStorage 2.0

import "../code/logic.js" as Logic

Item {
	id: tomatoid

	//************ OPTIONS ************

	property string appName: "Tomatoid"

	Layout.minimumWidth: 400
	Layout.minimumHeight: 400 

	property bool playNotificationSound: true
	property bool playTickingSound: false
	property bool playTickingSoundOnBreaks: false
	property bool continuousMode: false
        property bool completeContinuousMode: false
	property bool inPomodoro: false
	property bool inBreak: false
	property bool timerActive: inPomodoro || inBreak

	property bool popupNotification: true
	property bool kdeNotification: true
	property bool noNotification: false

	property int pomodoroLength: 25
	property int shortBreakLength: 5
	property int longBreakLength: 20
	property int pomodorosPerLongBreak: 4

	property string actionStartTimer
	property string actionStartBreak
	property string actionEndBreak
	property string actionEndCycle

	property int completedPomodoros: 0

	property int tickingVolume: 50

	//************ /OPTIONS ************

	//list of tasks
	ListModel { id: completeTasks }
	ListModel { id: incompleteTasks }

	property Item currentView: toolBarLayout.currentTab

	Component.onCompleted: {
		// FIXME
		//plasmoid.addEventListener("ConfigChanged", configChanged)
		Logic.loadData();

		tomatoid.forceActiveFocus();
	}


	function configChanged() {
		playNotificationSound = plasmoid.configuration.playNotificationSound;
		tickingVolume = plasmoid.configuration.tickingVolume;
		playTickingSound = plasmoid.configuration.playTickingSound;
		playTickingSoundOnBreaks = plasmoid.configuration.playTickingSoundOnBreaks;
		continuousMode = plasmoid.configuration.continuousMode;
		completeContinuousMode = plasmoid.configuration.completeContinuousMode;
		pomodoroLength = plasmoid.configuration.pomodoroLength;
		shortBreakLength = plasmoid.configuration.shortBreakLength;
		longBreakLength = plasmoid.configuration.longBreakLength;
		pomodorosPerLongBreak = plasmoid.configuration.pomodorosPerLongBreak;
		popupNotification = plasmoid.configuration.popupNotification;
		kdeNotification = plasmoid.configuration.kdeNotification;
		noNotification = plasmoid.configuration.noNotification;
		actionStartTimer = plasmoid.configuration.actionStartTimer;
		actionStartBreak = plasmoid.configuration.actionStartBreak;
		actionEndBreak = plasmoid.configuration.actionEndBreak;
		actionEndCycle = plasmoid.configuration.actionEndCycle;
		if(Logic.test){
			console.log(completeContinuousMode);
		}
	}

	property Component compactRepresentation: Component {
		TomatoidIcon {
			id: iconComponent
		}
	}

	PlasmaComponents.ToolBar {
		id: toolBar
		property alias query: topBar.query

		tools: TopBar {
			id: topBar
		}
	}

	PlasmaComponents.TabBar {
		id: tabBar
		height: 35

		currentTab: incompleteTaskList
		onCurrentTabChanged: tomatoid.forceActiveFocus();

		PlasmaComponents.TabButton { tab: incompleteTaskList; text: i18n("Tasks") }
		PlasmaComponents.TabButton { tab: completeTaskList; text: i18n("Done") }

		anchors {
			top: toolBar.bottom
			left: parent.left
			right: parent.right
			margins: 7
			leftMargin: 10
			rightMargin: 10
		}
	}

	PlasmaCore.FrameSvgItem {
		id: taskFrame
		anchors.fill: toolBarLayout
		imagePath: "widgets/frame"
		prefix: "sunken"
	}

	PlasmaComponents.TabGroup {
		id: toolBarLayout

		anchors {
			top: tabBar.bottom
			left: parent.left
			right: parent.right
			bottom: parent.bottom
			bottomMargin: timerActive ? 32 : 5
			margins: 5

			Behavior on bottomMargin {
				NumberAnimation {
					duration: 400
					easing.type: Easing.OutQuad
				}
			}
		}


		TaskList {
			id: incompleteTaskList

			model: incompleteTasks
			done: false

			onDoTask: Logic.doTask(taskIdentity)
			onRemoveTask: Logic.removeTask(taskIdentity, incompleteTasks)
			onStartTask: Logic.startTask(taskIdentity, taskName)
			onRenameTask: Logic.renameTask(taskIdentity, newName)
		}

		TaskList {
			id: completeTaskList

			model: completeTasks
			done: true

			onDoTask: Logic.undoTask(taskIdentity)
			onRemoveTask: Logic.removeTask(taskIdentity, completeTasks)
		}
	}

	Keys.forwardTo: [tabBar.layout]

	Keys.onPressed: {
		switch(event.key) {
			case Qt.Key_Up: {
				console.log("root up")
				currentView.decrementCurrentIndex();
				event.accepted = true;
				break;
			}
			case Qt.Key_Down: {
				console.log("root down")
				currentView.incrementCurrentIndex();
				event.accepted = true;
				break;
			}
			case Qt.Key_Escape: {
				plasmoid.togglePopup();
				event.accepted = true;
				break;
			}
			case Qt.Key_Tab: {
				console.log("root tab")
				toolBar.query.focus = true;
				event.accepted = true;
				break;
			}
			case Qt.Key_Space: {
				if(tomatoid.timerActive)
					timer.running = !timer.running
				event.accepted = true;
				break;
			}
			case Qt.Key_S: {
				if(tomatoid.timerActive)
					Logic.stop()
				event.accepted = true;
				break;
			}
			default: {
				console.log(event.key);
			}
		}
	}

	SoundEffect {
		id: notificationSound
		source: plasmoid.file("data", "notification.wav")
	}

	SoundEffect {
		id: tickingSound
		source: plasmoid.file("data", "tomatoid-ticking.wav")
		volume: tickingVolume / 100 //volume from 0.1 to 1.0
	}

	PlasmaCore.DataSource {
        id: notificationSource
        engine: "notifications"
        connectedSources: "org.freedesktop.Notifications"
    }

	function notify(summary, body) {
	    console.log("showing notification: " + summary + " | " + body);

	    var service = notificationSource.serviceForSource("notification");
		var op = service.operationDescription("createNotification");
		op["appName"] = tomatoid.appName;
		op["appIcon"] = "chronometer"
		op["summary"] = summary;
		op["body"] = body;
		op["timeout"] = 7000;

		service.startOperationCall(op);

		console.log(op)
	}


	//Actual timer. This will store the remaining seconds, total seconds and will return a timeout in the end.
	property QtObject timer: TomatoidTimer {
		id: timer

		onTick: {
			if(playTickingSound){
                if(inBreak){
                        if(playTickingSoundOnBreaks){
                                tickingSound.play();
                        }
                } else {
                        tickingSound.play();
                }
            }
		}
		onTimeout: {
			if(playNotificationSound)
				notificationSound.play();
			if(popupNotification) {
				// FIXME, use MessageDialog?
				//plasmoid.showPopup(5000)
			}

			if(inPomodoro) {
				console.log(taskId)
				Logic.completePomodoro(taskId)
				Logic.startBreak()

				if(kdeNotification)
					notify(i18n("Pomodoro completed"), i18n("Great job! Now take a break and relax for a moment."));
			} else if(inBreak) {
				Logic.endBreak()
				if(kdeNotification)
					notify(i18n("Relax time is over"), i18n("Get back to work. Choose a task and start again."));
				if(continuousMode){
                        if(completedPomodoros % pomodorosPerLongBreak == 0){ //if this is a long break
                                if(completeContinuousMode)
                                        Logic.startTask(timer.taskId, timer.taskName)
                        } else {
                                Logic.startTask(timer.taskId, timer.taskName)
                        }
                }
			}
		}
	}

	//chronometer with action buttons and regressive progress bar in the bottom. This will get the time from TomatoidTimer
	Chronometer {
		id: chronometer
		height: 22
		seconds: timer.seconds
		totalSeconds: timer.totalSeconds
		opacity: timerActive * 1 //only show if timer is running

		onPlayPressed: {
			timer.running = true
		}

		onPausePressed: {
			timer.running = false
		}

		onStopPressed: {
			Logic.stop()
		}

		anchors {
			left: tomatoid.left
			right: tomatoid.right
			bottom: tomatoid.bottom
			leftMargin: 5
			bottomMargin: 5
		}
	}
}
