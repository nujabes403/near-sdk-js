import {
    NearBindgen,
    call,
    view,
    near,
    UnorderedMap,
    LookupMap,
    Vector,
    UnorderedSet,
} from "near-sdk-js";

class Car {
    static schema = {
        name: "string",
        speed: "number",
    };
    constructor() {
        this.name = "";
        this.speed = 0;
    }

    info() {
        return this.name + " run with speed " + this.speed.toString()
    }
}

@NearBindgen({})
export class StatusDeserializeClass {
    static schema = {
        is_inited: "boolean",
        records: {map: { key: 'string', value: 'string' }},
        car: Car,
        messages: {array: {value: 'string'}},
        efficient_recordes: {unordered_map: {value: 'string'}},
        nested_efficient_recordes: {unordered_map: {value: { unordered_map: {value: 'string'}}}},
        nested_lookup_recordes: {unordered_map: {value: { lookup_map: {value: 'string'}}}},
        vector_nested_group: {vector: {value: { lookup_map: {value: 'string'}}}},
        lookup_nest_vec: {lookup_map: {value: { vector: { value: 'string' }}}},
        unordered_set: {unordered_set: {value: 'string'}},
        user_car_map: {unordered_map: {value: Car }},
        big_num: 'bigint',
        date: 'date'
    };
    constructor() {
        this.is_inited = false;
        this.records = {};
        this.car = new Car();
        this.messages = [];
        // account_id -> message
        this.efficient_recordes = new UnorderedMap("a");
        // id -> account_id -> message
        this.nested_efficient_recordes = new UnorderedMap("b");
        // id -> account_id -> message
        this.nested_lookup_recordes = new UnorderedMap("c");
        // index -> account_id -> message
        this.vector_nested_group = new Vector("d");
        // account_id -> index -> message
        this.lookup_nest_vec = new LookupMap("e");
        this.unordered_set = new UnorderedSet("f");
        this.user_car_map = new UnorderedMap("g");
        this.big_num = 1n;
        this.date = new Date();
    }

    @call({})
    init_contract({ }) {
        if (this.is_inited) {
            near.log(`message inited`);
            return;
        }
        this.is_inited = true;
    }

    @view({})
    is_contract_inited({}) {
        near.log(`query is_contract_inited`);
        return this.is_inited;
    }

    @call({})
    set_record({ message }) {
        let account_id = near.signerAccountId();
        near.log(`${account_id} set_status with message ${message}`);
        this.records[account_id] = message;
    }

    @view({})
    get_record({ account_id }) {
        near.log(`get_record for account_id ${account_id}`);
        return this.records[account_id] || null;
    }


    @call({})
    set_car_info({ name, speed }) {
        let account_id = near.signerAccountId();
        near.log(`${account_id} set_car_info name ${name}, speed ${speed}`);
        let car = new Car();
        car.name = name;
        car.speed = speed;
        this.car = car;
        this.user_car_map.set(account_id, car);
    }

    @view({})
    get_car_info({ }) {
        near.log(`get_car_info`);
        return this.car.info();
    }

    @view({})
    get_user_car_info({ account_id }) {
        near.log(`get_user_car_info for account_id ${account_id}`);
        let car = this.user_car_map.get(account_id);
        if (car == null) {
            return null;
        }
        return car.info();
    }

    @call({})
    push_message({ message }) {
        let account_id = near.signerAccountId();
        near.log(`${account_id} push_message message ${message}`);
        this.messages.push(message);
    }

    @view({})
    get_messages({ }) {
        near.log(`get_messages`);
        return this.messages.join(',');
    }

    @call({})
    set_nested_efficient_recordes({ message, id }) {
        let account_id = near.signerAccountId();
        near.log(`${account_id} set_nested_efficient_recordes with message ${message},id ${id}`);
        this.efficient_recordes.set(account_id, message);
        const nestedMap = this.nested_efficient_recordes.get(id, {
            defaultValue: new UnorderedMap("i_" + id + "_"),
        });
        nestedMap.set(account_id, message);
        this.nested_efficient_recordes.set(id, nestedMap);

        const nestedLookup = this.nested_lookup_recordes.get(id, {
            defaultValue: new LookupMap("li_" + id + "_"),
        });
        nestedLookup.set(account_id, message);
        this.nested_lookup_recordes.set(id, nestedLookup);

        // vector_nested_group: {vector: {value: { lookup_map: {value: 'string'}}}},
        const vecNestedLookup = this.vector_nested_group.get(0, {
            defaultValue: new LookupMap("di_0_"),
        });
        vecNestedLookup.set(account_id, message);
        if (this.vector_nested_group.isEmpty()) {
            this.vector_nested_group.push(vecNestedLookup);
        } else {
            this.vector_nested_group.replace(0, vecNestedLookup);
        }

        const lookupNestVec = this.lookup_nest_vec.get(account_id, {
            defaultValue: new Vector("ei_" + account_id + "_"),
        });
        lookupNestVec.push(message);
        this.lookup_nest_vec.set(account_id, lookupNestVec);

        this.unordered_set.set(account_id);
    }

    @call({})
    set_big_num_and_date({ bigint_num, new_date }) {
        let account_id = near.signerAccountId();
        near.log(`${account_id} set_bigint_and_date bigint_num ${bigint_num}, new_date: ${new_date}`);
        this.big_num = bigint_num;
        this.date = new_date;
    }

    @view({})
    get_big_num({ }) {
        near.log(`get_big_num}`);
        return this.big_num;
    }

    @view({})
    get_date({ }) {
        near.log(`get_date`);
        return this.date;
    }

    @view({})
    get_efficient_recordes({ account_id }) {
        near.log(`get_efficient_recordes for account_id ${account_id}`);
        return this.efficient_recordes.get(account_id);
    }

    @view({})
    get_nested_efficient_recordes({ account_id, id }) {
        near.log(`get_nested_efficient_recordes for account_id ${account_id}, id ${id}`);
        return this.nested_efficient_recordes.get(id, {
            defaultValue: new UnorderedMap("i_" + id + "_"),
        }).get(account_id);
    }

    @view({})
    get_nested_lookup_recordes({ account_id, id }) {
        near.log(`get_nested_lookup_recordes for account_id ${account_id}, id ${id}`);
        return this.nested_lookup_recordes.get(id, {
            defaultValue: new LookupMap("li_" + id + "_"),
        }).get(account_id);
    }

    @view({})
    get_vector_nested_group({ idx, account_id }) {
        near.log(`get_vector_nested_group for idx ${idx}, account_id ${account_id}`);
        return this.vector_nested_group.get(idx).get(account_id);
    }

    @view({})
    get_lookup_nested_vec({ account_id, idx }) {
        near.log(`get_looup_nested_vec for account_id ${account_id}, idx ${idx}`);
        return this.lookup_nest_vec.get(account_id).get(idx);
    }

    @view({})
    get_is_contains_user({ account_id }) {
        near.log(`get_is_contains_user for account_id ${account_id}`);
        return this.unordered_set.contains(account_id);
    }

    @view({})
    get_subtype_of_efficient_recordes({  }) {
        near.log(`get_subtype_of_efficient_recordes`);
        return this.efficient_recordes.subtype();
    }

    @view({})
    get_subtype_of_nested_efficient_recordes({  }) {
        near.log(`get_subtype_of_nested_efficient_recordes`);
        return this.nested_efficient_recordes.subtype();
    }

    @view({})
    get_subtype_of_nested_lookup_recordes({  }) {
        near.log(`get_subtype_of_nested_lookup_recordes`);
        return this.nested_lookup_recordes.subtype();
    }
}
