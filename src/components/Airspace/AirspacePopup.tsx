import type { AirspaceZone, DangerArea, RestrictedArea, MilitaryExerciseArea } from '../../types/airspace.types';
import { TimeCalculator } from '../../utils/timeUtils';

export class AirspacePopupGenerator {
    static createDangerAreaPopupContent(area: DangerArea): string {
        const timeRestrictions = area.timeRestrictions?.map(tr => 
            `${tr.startTime}-${tr.endTime} (${tr.daysOfWeek.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')})`
        ).join('<br>') || 'No time restrictions';

        return `
            <div class="airspace-popup danger-area">
                <div><strong>${area.name}</strong></div>
                <div>Type: DANGER AREA</div>
                <div>Authority: ${area.authority}</div>
                <div>Hazard: ${area.hazardType.replace('_', ' ').toUpperCase()}</div>
                <div>Risk Level: <span class="risk-${area.riskLevel}">${area.riskLevel.toUpperCase()}</span></div>
                <div>Altitude: ${area.altitudeLimits.lower}-${area.altitudeLimits.upper} ft ${area.altitudeLimits.reference}</div>
                <div>Status: <span class="status-${area.isActive ? 'active' : 'inactive'}">${area.isActive ? 'ACTIVE' : 'INACTIVE'}</span></div>
                <div>Time Restrictions:</div>
                <div class="time-restrictions">${timeRestrictions}</div>
                <div class="description">${area.description}</div>
            </div>
        `;
    }

    static createRestrictedAreaPopupContent(area: RestrictedArea): string {
        const timeRestrictions = area.timeRestrictions?.map(tr => 
            `${tr.startTime}-${tr.endTime} (${tr.daysOfWeek.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')})`
        ).join('<br>') || 'No time restrictions';

        return `
            <div class="airspace-popup restricted-area">
                <div><strong>${area.name}</strong></div>
                <div>Type: RESTRICTED AREA</div>
                <div>Authority: ${area.authority}</div>
                <div>Restriction: ${area.restrictionType.replace('_', ' ').toUpperCase()}</div>
                <div>Permit Required: ${area.permitRequired ? 'YES' : 'NO'}</div>
                <div>Altitude: ${area.altitudeLimits.lower}-${area.altitudeLimits.upper} ft ${area.altitudeLimits.reference}</div>
                <div>Status: <span class="status-${area.isActive ? 'active' : 'inactive'}">${area.isActive ? 'ACTIVE' : 'INACTIVE'}</span></div>
                ${area.contactInfo ? `<div>Contact: ${area.contactInfo}</div>` : ''}
                <div>Time Restrictions:</div>
                <div class="time-restrictions">${timeRestrictions}</div>
                <div class="description">${area.description}</div>
            </div>
        `;
    }

    static createMilitaryAreaPopupContent(area: MilitaryExerciseArea): string {
        const startTime = TimeCalculator.formatFlightTime(area.scheduledStart);
        const endTime = TimeCalculator.formatFlightTime(area.scheduledEnd);
        const timeRemaining = TimeCalculator.calculateTimeRemaining(area.scheduledEnd);

        return `
            <div class="airspace-popup military-area">
                <div><strong>${area.name}</strong></div>
                <div>Type: MILITARY EXERCISE</div>
                <div>Exercise: ${area.exerciseName}</div>
                <div>Authority: ${area.authority}</div>
                <div>Exercise Type: ${area.exerciseType.replace('_', ' ').toUpperCase()}</div>
                <div>Altitude: ${area.altitudeLimits.lower}-${area.altitudeLimits.upper} ft ${area.altitudeLimits.reference}</div>
                <div>Status: <span class="status-${area.isActive ? 'active' : 'inactive'}">${area.isActive ? 'ACTIVE' : 'INACTIVE'}</span></div>
                <div>Schedule: ${startTime} - ${endTime}</div>
                <div>Time Remaining: ${timeRemaining}</div>
                <div>Participating Units:</div>
                <div class="units">${area.participatingUnits.join('<br>')}</div>
                <div class="description">${area.description}</div>
            </div>
        `;
    }

    static attachAirspacePopup(feature: GeoJSON.Feature, layer: L.Layer, zone: AirspaceZone): void {
        let popupContent: string;

        switch (zone.type) {
            case 'danger':
                popupContent = AirspacePopupGenerator.createDangerAreaPopupContent(zone as DangerArea);
                break;
            case 'restricted':
                popupContent = AirspacePopupGenerator.createRestrictedAreaPopupContent(zone as RestrictedArea);
                break;
            case 'military':
                popupContent = AirspacePopupGenerator.createMilitaryAreaPopupContent(zone as MilitaryExerciseArea);
                break;
            default:
                popupContent = `
                    <div class="airspace-popup">
                        <div><strong>${zone.name}</strong></div>
                        <div>Type: ${zone.type.toUpperCase()}</div>
                        <div>Authority: ${zone.authority}</div>
                        <div>Status: ${zone.isActive ? 'ACTIVE' : 'INACTIVE'}</div>
                        <div>${zone.description}</div>
                    </div>
                `;
        }

        layer.bindPopup(popupContent, { maxWidth: 300 });
    }
}
