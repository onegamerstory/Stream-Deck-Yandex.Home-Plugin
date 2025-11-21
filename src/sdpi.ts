export type DataSourcePayload = {
    event: string;
    items: DataSourceResult;
};


export type DataSourceResult = DataSourceResultItem[];


export type DataSourceResultItem = Item;


export type Item = {
    disabled?: boolean;
    label?: string;
    value: string;
};