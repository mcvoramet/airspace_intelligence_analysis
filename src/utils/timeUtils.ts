export class TimeCalculator {
    static calculateTimeRemaining(validEnd: string): string {
        try {
            const endTime = new Date(validEnd)
            const now = new Date()
            const timeDiff = endTime.getTime() - now.getTime()

            if (timeDiff <= 0) return 'Expired';

            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

            if (hours > 24) {
                const days = Math.floor(hours / 24)
                const remainingHours = hours % 24
                return `${days}d ${remainingHours}h ${minutes}m`
            } else if (hours > 0) {
                return `${hours}h ${minutes}m`;
            } else {
                return `${minutes}m`;
            }
        } catch (error) {
            console.error('Error calculating time remaining:', error)
            return 'Invalid date'
        }
    }

    static formatFlightTime(timestamp: string): string {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting flight time:', error);
            return 'Invalid time';
        }
    }

    static calculateFlightDuration(takeOffTime: string, arrivalTime: string): string {
        try {
            const takeOff = new Date(takeOffTime);
            const arrival = new Date(arrivalTime);
            const duration = arrival.getTime() - takeOff.getTime();

            const hours = Math.floor(duration / (1000 * 60 * 60));
            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

            return `${hours}h ${minutes}m`;
        } catch (error) {
            console.error('Error calculating flight duration:', error);
            return 'Invalid duration';
        }
    }

    static isTimeInRange(currentTime: Date, startTime: string, endTime: string): boolean {
        try {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            
            const currentHour = currentTime.getHours();
            const currentMinute = currentTime.getMinutes();
            
            const currentTimeMinutes = currentHour * 60 + currentMinute;
            const startTimeMinutes = startHour * 60 + startMinute;
            const endTimeMinutes = endHour * 60 + endMinute;

            return startTimeMinutes <= endTimeMinutes
                ? currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes
                : currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
        } catch (error) {
            console.error('Error checking time range:', error);
            return false;
        }
    }

    static addHoursToTime(timestamp: string, hours: number): string {
        try {
            const date = new Date(timestamp);
            date.setHours(date.getHours() + hours);
            return date.toISOString();
        } catch (error) {
            console.error('Error adding hours to time:', error);
            return timestamp;
        }
    }
}
