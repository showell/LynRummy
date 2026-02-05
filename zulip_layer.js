// ZULIP LAYER:

const api_key = "EFCaswMRJKvdwbI2g5SwhPnkz0gNDQOO";
const my_email = "showell30@yahoo.com";
const site = "https://macandcheese.zulipchat.com";

function get_headers() {
    const auth = btoa(`${my_email}:${api_key}`);
    const auth_header = `Basic ${auth}`;
    return { Authorization: auth_header };
}

function form_data(params: Record<string, string>) {
    const form_data = new FormData();
    Object.keys(params).forEach((key) => {
        let data = params[key];
        if (Array.isArray(data)) {
            data = JSON.stringify(data);
        }
        form_data.append(key, data);
    });

    return form_data;
}

function post_to_channel() {
    const query = `messages`;

    const params = {
        type: "stream",
        to: "LynRummy",
        topic: "automated",
        content: "test from LynRummy client",
    };

    const url = `${site}/api/v1/${query}`;
    const method = "POST";

    const options = { method, headers: get_headers(), body: form_data(params) };

    const promise = fetch(url, options);
    promise.then((response) => {
        const json_promise = response.json();
        json_promise.then((data) => {
            console.log(data);
        });
    });
}

function get_user_info() {
    const query = `users/${my_email}`;

    const url = `${site}/api/v1/${query}`;
    const method = "GET";

    const options = { method, headers: get_headers() };

    const promise = fetch(url, options);
    promise.then((response) => {
        const json_promise = response.json();
        json_promise.then((data) => {
            console.log(data);
        });
    });
}

function talk_to_zulip() {
    get_user_info();
    post_to_channel();
}

// talk_to_zulip();

