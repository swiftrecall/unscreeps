export class ColonyRoadService {
	private memory: {
		routes: {
			[key: string]: {
				route: RoomPosition[];
				metadata?: any;
			};
		};
	};

	constructor(colonyName: string) {
		if (!Memory.colonies[colonyName].roadService) {
			Memory.colonies[colonyName].roadService = {
				routes: {}
			};
		}

		this.memory = Memory.colonies[colonyName].roadService;
	}

	private getRouteKey(start: Id<any>, end: Id<any>): string {
		return `${start}->${end}`;
	}

	public getRoute(start: Id<any>, end: Id<any>): RoomPosition[] | null {
		const routeKey = this.getRouteKey(start, end);
		return null;
	}
}
