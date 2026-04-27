import type { CustomerAddressType } from '../types/online';

export type OrderAddressTypeConfig = {
  showBuildingName: boolean;
  showEntrance: boolean;
  showFloor: boolean;
  showApartmentUnit: boolean;
  showDoorNameOrNumber: boolean;
  showCompanyName: boolean;
  showLeaveAt: boolean;
  showAccessMethod: boolean;
  showCourierNotes: boolean;
};

export const ORDER_ADDRESS_TYPE_CONFIG: Record<CustomerAddressType, OrderAddressTypeConfig> = {
  apartment: {
    showBuildingName: true,
    showEntrance: true,
    showFloor: true,
    showApartmentUnit: true,
    showDoorNameOrNumber: false,
    showCompanyName: false,
    showLeaveAt: false,
    showAccessMethod: true,
    showCourierNotes: true,
  },
  house: {
    showBuildingName: false,
    showEntrance: true,
    showFloor: false,
    showApartmentUnit: false,
    showDoorNameOrNumber: true,
    showCompanyName: false,
    showLeaveAt: false,
    showAccessMethod: true,
    showCourierNotes: true,
  },
  office: {
    showBuildingName: true,
    showEntrance: true,
    showFloor: true,
    showApartmentUnit: false,
    showDoorNameOrNumber: false,
    showCompanyName: true,
    showLeaveAt: true,
    showAccessMethod: false,
    showCourierNotes: true,
  },
  hotel: {
    showBuildingName: false,
    showEntrance: false,
    showFloor: false,
    showApartmentUnit: false,
    showDoorNameOrNumber: false,
    showCompanyName: false,
    showLeaveAt: false,
    showAccessMethod: false,
    showCourierNotes: true,
  },
  other: {
    showBuildingName: false,
    showEntrance: false,
    showFloor: false,
    showApartmentUnit: false,
    showDoorNameOrNumber: false,
    showCompanyName: false,
    showLeaveAt: false,
    showAccessMethod: false,
    showCourierNotes: true,
  },
};
