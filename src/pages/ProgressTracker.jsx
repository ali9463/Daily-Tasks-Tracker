import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCcw, Lock, CheckCircle, XCircle, RotateCw } from 'lucide-react'; // Added RotateCw for reset icon

// Constants for time and progress calculation
const HALF_DAY_IN_MS = 12 * 60 * 60 * 1000;  // 12 hours instead of 24
const PROGRESS_INCREMENT = 5; // Increase by 5% per day (20 days to reach 100%)

const initialTasks = [
    { id: 1, text: "Web Dev Week 1 work", color: "border-blue-500 bg-blue-50", isChecked: false },
    { id: 2, text: "Internship BizLink", color: "border-red-500 bg-red-50", isChecked: false },
    { id: 3, text: "Uni Subjects", color: "border-green-500 bg-green-50", isChecked: false },
    // { id: 4, text: "FYP Features", color: "border-yellow-500 bg-yellow-50", isChecked: false },
    // { id: 5, text: "Plan Tomorrow's Tasks", color: "border-purple-500 bg-purple-50", isChecked: false },
];

// Helper function to calculate time until unlock
const getTimeUntilUnlock = (lastDoneTime) => {
    if (!lastDoneTime) return 0;
    const nextUnlockTime = lastDoneTime + HALF_DAY_IN_MS;
    return nextUnlockTime - Date.now();
};

const ProgressTracker = () => {
    const [tasks, setTasks] = useState(() => {
        const savedTasks = localStorage.getItem('dailyTasks');
        return savedTasks ? JSON.parse(savedTasks) : initialTasks;
    });

    const [progress, setProgress] = useState(() => {
        const savedProgress = localStorage.getItem('sixMonthProgress');
        return savedProgress ? parseFloat(savedProgress) : 0;
    });

    const [lastDoneTime, setLastDoneTime] = useState(() => {
        const savedTime = localStorage.getItem('lastDoneTime');
        return savedTime ? parseInt(savedTime, 10) : null;
    });

    const [dayCount, setDayCount] = useState(() => {
        const savedDayCount = localStorage.getItem('dayCount');
        return savedDayCount ? parseInt(savedDayCount, 10) : 0;
    });

    const [isLocked, setIsLocked] = useState(false);
    const [unlockTimer, setUnlockTimer] = useState(null);

    useEffect(() => {
        localStorage.setItem('dailyTasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem('sixMonthProgress', progress.toFixed(2));
    }, [progress]);

    useEffect(() => {
        localStorage.setItem('lastDoneTime', lastDoneTime ? lastDoneTime.toString() : '');
    }, [lastDoneTime]);

    useEffect(() => {
        localStorage.setItem('dayCount', dayCount.toString());
    }, [dayCount]);

    // --- Locking Logic Effect (Manage timer and button lock) ---
    useEffect(() => {
        const checkLockStatus = () => {
            const timeRemaining = getTimeUntilUnlock(lastDoneTime);

            if (timeRemaining > 0) {
                setIsLocked(true);
                setUnlockTimer(timeRemaining);
            } else {
                setIsLocked(false);
                setUnlockTimer(0);
            }
        };

        // Initial check
        checkLockStatus();

        // Set interval to check every second if locked
        const intervalId = setInterval(checkLockStatus, 1000);

        return () => clearInterval(intervalId);
    }, [lastDoneTime]);

    // Computed state
    const allTasksCompleted = useMemo(() => tasks.every(task => task.isChecked), [tasks]);
    const isDoneButtonEnabled = allTasksCompleted && !isLocked;

    // Format time remaining for display
    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    };

    // Task toggling handler
    const handleTaskToggle = useCallback((taskId) => {
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId ? { ...task, isChecked: !task.isChecked } : task
            )
        );
    }, []);

    // "Done" button handler
    const handleDone = useCallback(() => {
        if (!isDoneButtonEnabled) return;

        // 1. Increase progress
        setProgress(prevProgress => Math.min(100, prevProgress + PROGRESS_INCREMENT));

        // 2. Update time and day count
        setLastDoneTime(Date.now());
        setDayCount(prevCount => prevCount + 1);

        // 3. Reset checklist for the next day
        setTasks(initialTasks);

    }, [isDoneButtonEnabled]);

    // Reset button handler
    // const handleReset = useCallback(() => {
    //     setTasks(initialTasks);
    //     setProgress(0);
    //     setLastDoneTime(null);
    //     setDayCount(0);
    //     setIsLocked(false);
    //     setUnlockTimer(0);
    //     // Clear localStorage keys
    //     localStorage.removeItem('dailyTasks');
    //     localStorage.removeItem('sixMonthProgress');
    //     localStorage.removeItem('lastDoneTime');
    //     localStorage.removeItem('dayCount');
    // }, []);

    // --- Render Components ---

    const TaskItem = ({ task }) => (
        <div className={`p-3 mb-2 rounded-lg shadow-sm border-l-4 ${task.color} flex items-center justify-between transition-all duration-200`}>
            <label className="flex items-center space-x-3 cursor-pointer select-none w-full">
                <input
                    type="checkbox"
                    checked={task.isChecked}
                    onChange={() => handleTaskToggle(task.id)}
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 transition duration-150 ease-in-out"
                />
                <span className={`text-gray-800 font-medium ${task.isChecked ? 'line-through opacity-60' : ''}`}>
                    {task.text}
                </span>
            </label>
            {task.isChecked ? <CheckCircle className="w-5 h-5 text-green-600" /> : null}
        </div>
    );

    const ProgressBar = () => {
        const widthStyle = `${progress.toFixed(0)}%`;

        // Dynamic color change based on progress
        let progressGradient = 'bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400';
        if (progress >= 80) {
            progressGradient = 'bg-gradient-to-r from-green-500 to-emerald-500';
        } else if (progress >= 50) {
            progressGradient = 'bg-gradient-to-r from-yellow-500 to-lime-500';
        } else {
            progressGradient = 'bg-gradient-to-r from-indigo-400 to-blue-400';
        }

        return (
            <div className="mt-8">
                <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                    <span>6-Month Goal Progress</span>
                    <span>{widthStyle}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                        className={`h-3 rounded-full transition-all duration-700 ease-out ${progressGradient}`}
                        style={{ width: widthStyle }}
                    ></div>
                </div>
            </div>
        );
    };

    const StatusDisplay = () => {
        const maxDays = Math.ceil(100 / PROGRESS_INCREMENT);
        const DayPill = ({ day, isCompleted }) => (
            <span className="flex items-center text-sm font-medium mr-2 mb-2 p-2 rounded-full border border-gray-300 bg-white">
                Day {day}: {isCompleted ? <CheckCircle className="w-4 h-4 ml-1 text-green-500" /> : '...'}
            </span>
        );

        return (
            <div className="mt-6 p-4 bg-gray-100 rounded-xl shadow-inner">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Streak Status ({dayCount} / {maxDays})</h3>
                <div className="flex flex-wrap max-h-40 overflow-y-auto">
                    {/* Display completed days */}
                    {Array.from({ length: dayCount }).map((_, index) => (
                        <DayPill key={index} day={index + 1} isCompleted={true} />
                    ))}
                    {/* Display current/next day as placeholder */}
                    {dayCount < maxDays && (
                        <DayPill day={dayCount + 1} isCompleted={false} />
                    )}
                </div>
            </div>
        );
    };

    const LockMessage = () => (
        <div className="text-center mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg flex items-center justify-center space-x-2">
            <Lock className="w-5 h-5" />
            <p className="font-semibold">Work Hard for Success {formatTime(unlockTimer)}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-2xl shadow-2xl">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
                    <CheckCircle className="w-8 h-8 text-indigo-600 mr-2" />
                    Ali Tasks Tracker
                </h1>

                {/* Task Checklist */}
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">My Tasks</h2>
                    {tasks.map(task => (
                        <TaskItem key={task.id} task={task} />
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex space-x-4">
                    <button
                        onClick={handleDone}
                        disabled={!isDoneButtonEnabled}
                        className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-lg transition-all duration-300 transform shadow-lg
                            ${isDoneButtonEnabled
                                ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] focus:ring-4 focus:ring-indigo-500/50'
                                : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {isLocked ? (
                            <span className='flex items-center justify-center'><Lock className="w-5 h-5 mr-2" /> Time Locked</span>
                        ) : allTasksCompleted ? (
                            <span className='flex items-center justify-center'><RefreshCcw className="w-5 h-5 mr-2" /> Done Tasks?</span>
                        ) : (
                            'Finish Today Work'
                        )}
                    </button>

                    {/* <button
                        onClick={handleReset}
                        className="flex items-center justify-center py-2 px-2 rounded-xl text-white font-bold text-xl bg-red-600 hover:bg-red-300 "
                    >
                        Reset
                    </button> */}
                </div>

                {isLocked && unlockTimer > 0 && <LockMessage />}

                {/* Progress Bar */}
                <ProgressBar />

                {/* Day Count / Streak */}
                <StatusDisplay />

            </div>
        </div>
    );
};

export default ProgressTracker;
