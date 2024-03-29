import { describe, expect, test } from "bun:test";
import * as cheerio from "cheerio";

import { PostgresDataSourceSingleton } from "../../src/postgres";
import { createApplicationServer } from "../../src/server";
import { getTestBaseUrl, loginUser, loginUserAdmin } from "../test_utils";
import { HtmxTargets } from "../../src/components/common/constants";
import { testAdminUser, testUser } from "../test_constants";
import { createInventoryItems, generateInventoryItems } from "../fixtures";

describe("Inventory routes file endpoints", async () => {
    const dataSource = await PostgresDataSourceSingleton.getInstance();
    const app = createApplicationServer(dataSource);
    const baseUrl = getTestBaseUrl(app);

    // Create an admin and non-admin user
    const loggedInCookie = await loginUser(app, testUser);
    const loggedInCookieAdmin = await loginUserAdmin(
        dataSource,
        app,
        testAdminUser
    );

    // Add some inventory items to the test database
    const numInitialInventoryItems = 10;
    const inventoryItems = generateInventoryItems(numInitialInventoryItems);
    await createInventoryItems(app, inventoryItems, loggedInCookieAdmin);

    describe("GET on /inventory endpoint", () => {
        describe("User session inactive", async () => {
            const response = await app.handle(
                new Request(`${baseUrl}/inventory`)
            );

            test("Returns 401 status code", async () => {
                expect(response.status).toBe(401);
            });
        });

        describe("User session active", async () => {
            describe("Non-admin user", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory`, {
                        headers: {
                            Cookie: loggedInCookie,
                        },
                    })
                );

                test("Returns 403 status code", () => {
                    expect(response.status).toBe(403);
                });
            });

            describe("Admin user", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory`, {
                        headers: {
                            Cookie: loggedInCookieAdmin,
                        },
                    })
                );

                test("Returns 200 status code", () => {
                    expect(response.status).toBe(200);
                });

                describe("HTMX markup response", async () => {
                    const $ = cheerio.load(await response.text());
                    const elementsWithHxGet = $("div[hx-get]");

                    test("Returns the main inventory page", () => {
                        const inventoryPageIdentifierDiv = $(
                            `#${HtmxTargets.INVENTORY_SECTION}`
                        );
                        expect(inventoryPageIdentifierDiv.length).toBe(1);
                    });

                    test("GET on /inventory/list is made on content load only", () => {
                        const hxGetValue = $(elementsWithHxGet.first()).attr(
                            "hx-get"
                        );
                        const hxTriggerValue = $(
                            elementsWithHxGet.first()
                        ).attr("hx-trigger");

                        expect(hxGetValue).toBe("/inventory/list");
                        expect(hxTriggerValue).toBe("load");
                    });

                    test("GET on /inventory/list has no hx-target (targets innerHTML of containing div)", () => {
                        const hxTargetValue = $(elementsWithHxGet.first()).attr(
                            "hx-target"
                        );
                        expect(hxTargetValue).toBeUndefined();
                    });
                });
            });
        });
    });

    describe("GET on /inventory/list endpoint", () => {
        describe("User session inactive", async () => {
            const response = await app.handle(
                new Request(`${baseUrl}/inventory/list`)
            );

            test("Returns 401 status code", () => {
                expect(response.status).toBe(401);
            });
        });

        describe("User session active", () => {
            describe("Non-admin user", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory/list`, {
                        headers: {
                            Cookie: loggedInCookie,
                        },
                    })
                );

                test("Returns 403 status code", () => {
                    expect(response.status).toBe(403);
                });
            });
            describe("Admin user", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory/list`, {
                        headers: {
                            Cookie: loggedInCookieAdmin,
                        },
                    })
                );

                test("Returns 200 status code", () => {
                    expect(response.status).toBe(200);
                });

                describe("HTMX markup response", async () => {
                    const $ = cheerio.load(await response.text());

                    test("Contains div to inject inventory list items markup", () => {
                        const targetElement = $(
                            `#${HtmxTargets.INVENTORY_DATA_LIST}`
                        );
                        expect(targetElement.length).toBe(1);
                    });

                    test("Can search for inventory items via GET /inventory/list/search with correct hx-target", () => {
                        const targetElement = $(
                            '[hx-get="/inventory/list/search"]'
                        );
                        const hxTargetValue = targetElement.attr("hx-target");
                        expect(targetElement.length).toBe(1);
                        expect(hxTargetValue).toBe(
                            `#${HtmxTargets.INVENTORY_DATA_LIST}`
                        );
                    });

                    test("GET /inventory/list/search has a user input delay before calling API", () => {
                        const targetElement = $(
                            '[hx-get="/inventory/list/search"]'
                        );
                        const hxTriggerValue = targetElement.attr("hx-trigger");
                        /**
                         * Ensure the hx-trigger checks for:
                         * keyup event: After the user has completed typing
                         * changed event: Ensure the text value of the input has changed before making a request
                         * delay: Has some delay before making the request
                         *
                         */
                        expect(hxTriggerValue).toContain("keyup");
                        expect(hxTriggerValue).toContain("changed");
                        expect(hxTriggerValue).toContain("delay");
                    });

                    test("Can open create inventory item view via GET /inventory/create with correct hx-target", () => {
                        const targetElement = $('[hx-get="/inventory/create"]');
                        const hxTargetValue = targetElement.attr("hx-target");
                        expect(targetElement.length).toBe(1);
                        expect(hxTargetValue).toBe(
                            `#${HtmxTargets.INVENTORY_SECTION}`
                        );
                    });

                    test("Calls GET on /inventory/list/all endpoint on content load only and the target to be its innerHTML", () => {
                        const targetElement = $(
                            '[hx-get="/inventory/list/all"]'
                        );
                        const hxTargetValue = targetElement.attr("hx-target");
                        const hxTriggerValue = targetElement.attr("hx-trigger");
                        expect(targetElement.length).toBe(1);
                        expect(hxTargetValue).toBeUndefined();
                        expect(hxTriggerValue).toBe("load");
                    });
                });
            });
        });
    });

    describe("GET on /inventory/list/all endpoint", () => {
        describe("User session inactive", async () => {
            const response = await app.handle(
                new Request(`${baseUrl}/inventory/list/all`)
            );

            test("Returns 401 status code", () => {
                expect(response.status).toBe(401);
            });
        });

        describe("User session active", () => {
            describe("Non-admin user", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory/list/all`, {
                        headers: {
                            Cookie: loggedInCookie,
                        },
                    })
                );

                test("Returns 403 status code", () => {
                    expect(response.status).toBe(403);
                });
            });

            describe("Admin user", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory/list/all`, {
                        headers: {
                            Cookie: loggedInCookieAdmin,
                        },
                    })
                );

                test("Returns 200 status code", () => {
                    expect(response.status).toBe(200);
                });

                describe("HTMX markup response", async () => {
                    const $ = cheerio.load(await response.text());
                    const rows = $("tbody tr");
                    const firstRow = rows.first();

                    test("Row can get inventory item orders via GET with correct hx-target value", () => {
                        const targetElement = firstRow.find(
                            '[hx-get="/inventory/orders/1"]'
                        );
                        const hxTargetValue = targetElement.attr("hx-target");

                        expect(targetElement.length).toBe(1);
                        expect(hxTargetValue).toBe(
                            `#${HtmxTargets.INVENTORY_SECTION}`
                        );
                    });

                    test("Row can open edit view via GET /inventory/edit/:inventoryId with correct hx-target value", () => {
                        const targetElement = firstRow.find(
                            '[hx-get="/inventory/edit/1"]'
                        );
                        const hxTargetValue = targetElement.attr("hx-target");

                        expect(targetElement.length).toBe(1);
                        expect(hxTargetValue).toBe(
                            `#${HtmxTargets.INVENTORY_SECTION}`
                        );
                    });
                });
            });
        });
    });

    describe("GET on /inventory/list/search endpoint", () => {
        describe("User session inactive", async () => {
            const response = await app.handle(
                new Request(
                    `${baseUrl}/inventory/list/search?search="searchTerm"`
                )
            );

            test("Returns 401 status code", () => {
                expect(response.status).toBe(401);
            });
        });

        describe("User session active", () => {
            describe("Non-admin user", async () => {
                const response = await app.handle(
                    new Request(
                        `${baseUrl}/inventory/list/search?search="searchTerm`,
                        {
                            headers: {
                                Cookie: loggedInCookie,
                            },
                        }
                    )
                );

                test("Returns 403 status code", () => {
                    expect(response.status).toBe(403);
                });
            });

            describe("Admin user and search term in inventory items", async () => {
                /**
                 * Use one of the rows from the already inserted inventory items to public get a positive
                 * search result.
                 */
                const response = await app.handle(
                    new Request(
                        `${baseUrl}/inventory/list/search?search=${inventoryItems[0].name}`,
                        {
                            headers: {
                                Cookie: loggedInCookieAdmin,
                            },
                        }
                    )
                );

                test("Returns 200 status code", () => {
                    expect(response.status).toBe(200);
                });

                describe("HTMX markup response", async () => {
                    const $ = cheerio.load(await response.text());
                    const rows = $("tbody tr");
                    test("Contains one row with searched inventory item", () => {
                        expect(rows.length).toBe(1);
                        // toUpperCase as all inventory items are uppercased on the backend
                        expect(rows.first().text()).toContain(
                            inventoryItems[0].name.toUpperCase()
                        );
                    });
                });
            });

            describe("Admin user and empty string as search term", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory/list/search?search=`, {
                        headers: {
                            Cookie: loggedInCookieAdmin,
                        },
                    })
                );

                test("Returns 200 status code", () => {
                    expect(response.status).toBe(200);
                });

                describe("HTMX markup response", async () => {
                    const $ = cheerio.load(await response.text());
                    const rows = $("tbody tr");
                    test("Contains all rows as no search term provided", () => {
                        expect(rows.length).toBeGreaterThan(0);
                    });
                });
            });
        });
    });

    describe("GET on /inventory/create endpoint", () => {
        describe("User session inactive", async () => {
            const response = await app.handle(
                new Request(`${baseUrl}/inventory/create`)
            );

            test("Returns 401 status code", () => {
                expect(response.status).toBe(401);
            });
        });

        describe("User session active", () => {
            describe("Non-admin user", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory/create`, {
                        headers: {
                            Cookie: loggedInCookie,
                        },
                    })
                );

                test("Returns 403 status code", () => {
                    expect(response.status).toBe(403);
                });
            });
            describe("Admin user", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory/create`, {
                        headers: {
                            Cookie: loggedInCookieAdmin,
                        },
                    })
                );

                test("Returns 200 status code", () => {
                    expect(response.status).toBe(200);
                });

                describe("HTMX markup response", async () => {
                    const $ = cheerio.load(await response.text());

                    test("Contains navigation to go back to main inventory page with corret hx-target", () => {
                        const targetElement = $('[hx-get="/inventory/list"]');
                        const hxTargetValue = targetElement.attr("hx-target");

                        expect(targetElement.length).toBe(1);
                        expect(hxTargetValue).toBe(
                            `#${HtmxTargets.INVENTORY_SECTION}`
                        );
                    });

                    test("Can create inventory item via POST /inventory/create", () => {
                        const targetElement = $(
                            '[hx-post="/inventory/create"]'
                        );
                        expect(targetElement.length).toBe(1);
                    });

                    test("Input and Price initially empty with correct name attributes for HTMX POST request", () => {
                        const nameInputValue = $('input[name="name"]');
                        const priceInputValue = $('input[name="price"]');

                        // expected this to be empty string, but it's actually undefined for empty inputs
                        expect(nameInputValue.val()).toBeUndefined();
                        expect(priceInputValue.val()).toBeUndefined();
                    });
                });
            });
        });
    });

    describe("GET on /inventory/edit/:inventoryId endpoint", () => {
        describe("User session inactive", async () => {
            const response = await app.handle(
                new Request(`${baseUrl}/inventory/edit/1`)
            );

            test("Returns 401 status code", () => {
                expect(response.status).toBe(401);
            });
        });

        describe("User session active", () => {
            describe("Non-admin user", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory/edit/1`, {
                        headers: {
                            Cookie: loggedInCookie,
                        },
                    })
                );

                test("Returns 403 status code", () => {
                    expect(response.status).toBe(403);
                });
            });
            describe("Admin user", async () => {
                // First search for a specific item to run tests on
                const searchInventoryItemResponse = await app.handle(
                    new Request(
                        `${baseUrl}/inventory/list/search?search=${inventoryItems[0].name}`,
                        {
                            headers: {
                                Cookie: loggedInCookieAdmin,
                            },
                        }
                    )
                );

                const $ = cheerio.load(
                    await searchInventoryItemResponse.text()
                );
                const editButton = $('button[hx-get^="/inventory/edit"]');
                expect(editButton.length).toBe(1);

                const hxGetValue = editButton.attr("hx-get");
                const getEditInventoryItemResponse = await app.handle(
                    new Request(`${baseUrl}${hxGetValue}`, {
                        headers: {
                            Cookie: loggedInCookieAdmin,
                        },
                    })
                );

                test("Returns 200 status code", () => {
                    expect(getEditInventoryItemResponse.status).toBe(200);
                });

                describe("HTMX markup response", async () => {
                    const responseText =
                        await getEditInventoryItemResponse.text();
                    const $ = cheerio.load(responseText);

                    test("Contains navigation to go back to main inventory screen with corret hx-target", () => {
                        const targetElement = $('[hx-get="/inventory/list"]');
                        const hxTargetValue = targetElement.attr("hx-target");

                        expect(targetElement.length).toBe(1);
                        expect(hxTargetValue).toBe(
                            `#${HtmxTargets.INVENTORY_SECTION}`
                        );
                    });

                    test("Can edit inventory item via POST /inventory/edit", () => {
                        const targetElement = $('[hx-post^="/inventory/edit"]');
                        expect(targetElement.length).toBe(1);
                    });

                    test("Input and Price pre-populated with existing values with correct name attributes for HTMX POST request", () => {
                        const nameInputValue = $('input[name="name"]');
                        const priceInputValue = $('input[name="price"]');

                        expect(nameInputValue.val()).toBe(
                            inventoryItems[0].name.toUpperCase()
                        );
                        expect(priceInputValue.val()).toBe(
                            inventoryItems[0].price.toString()
                        );
                    });
                });
            });
        });
    });

    describe("POST on /inventory/create endpoint", () => {
        describe("User session inactive", async () => {
            const response = await app.handle(
                new Request(`${baseUrl}/inventory/create`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: "Some item",
                        price: 50,
                    }),
                })
            );

            test("Returns 401 status code", () => {
                expect(response.status).toBe(401);
            });
        });

        describe("User session active", () => {
            describe("Non-admin user", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory/create`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Cookie: loggedInCookie,
                        },
                        body: JSON.stringify({
                            name: "Some item",
                            price: 50,
                        }),
                    })
                );

                test("Returns 403 status code", () => {
                    expect(response.status).toBe(403);
                });
            });

            describe("Admin user", async () => {
                const responseText = await app.handle(
                        new Request(`${baseUrl}/inventory/list/all`, {
                            headers: {
                                Cookie: loggedInCookieAdmin,
                            },
                        })
                    ).then(result => result.text());
                const $ = cheerio.load(responseText);
                const rows = $("tbody tr");
                const numRowsBeforeCreate = rows.length;

                const response = await app.handle(
                    new Request(`${baseUrl}/inventory/create`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Cookie: loggedInCookieAdmin,
                        },
                        body: JSON.stringify({
                            name: "Some item",
                            price: 50,
                        }),
                    })
                );

                test("Returns 201 status code", () => {
                    // TODO: return 200 for now https://github.com/nigelnindodev/BunHtmxFullStack/issues/44
                    expect(response.status).toBe(200);
                });

                test("Creates new inventory item", async () => {
                    const response = await app.handle(
                        new Request(`${baseUrl}/inventory/list/all`, {
                            headers: {
                                Cookie: loggedInCookieAdmin,
                            },
                        })
                    );

                    const $ = cheerio.load(await response.text());
                    const rows = $("tbody tr");

                    expect(rows.length).toBe(numRowsBeforeCreate + 1);
                });

                describe("HTMX markup response", async () => {
                    const $ = cheerio.load(await response.text());

                    test("Indicates inventory item added", () => {
                        expect($.text()).toInclude("Added");
                    });
                });
            });
        });
    });

    describe("POST on /inventory/edit/:inventoryId endpoint", () => {
        describe("User session inactive", async () => {
            const response = await app.handle(
                new Request(`${baseUrl}/inventory/edit/1`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: "Some item",
                        price: 50,
                    }),
                })
            );

            test("Returns 401 status code", () => {
                expect(response.status).toBe(401);
            });
        });

        describe("User session active", () => {
            describe("Non-admin user", async () => {
                const response = await app.handle(
                    new Request(`${baseUrl}/inventory/edit/1`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Cookie: loggedInCookie,
                        },
                        body: JSON.stringify({
                            name: "Some item",
                            price: 50,
                        }),
                    })
                );

                test("Returns 403 status code", () => {
                    expect(response.status).toBe(403);
                });
            });

            describe("Admin user", async () => {
                const changeInventoryNameTo = "Edited Inventory Item";
                const searchInventoryItemResponse = await app.handle(
                    new Request(
                        `${baseUrl}/inventory/list/search?search=${inventoryItems[0].name}`,
                        {
                            headers: {
                                Cookie: loggedInCookieAdmin,
                            },
                        }
                    )
                );

                const $ = cheerio.load(
                    await searchInventoryItemResponse.text()
                );
                const editButton = $('button[hx-get^="/inventory/edit"]');
                expect(editButton.length).toBe(1);

                const hxGetValue = editButton.attr("hx-get");

                // We we use the same URL for GET to match the POST request
                // So fine to use the hx-get value on post here
                const editInventoryItemResponse = await app.handle(
                    new Request(`${baseUrl}${hxGetValue}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Cookie: loggedInCookieAdmin,
                        },
                        body: JSON.stringify({
                            name: changeInventoryNameTo,
                            price: 100,
                        }),
                    })
                );

                test("Returns 200 status code", () => {
                    expect(editInventoryItemResponse.status).toBe(200);
                });

                test("No results using pre-update value as inventory search term", async () => {
                    const searchInventoryItemResponse = await app.handle(
                        new Request(
                            `${baseUrl}/inventory/list/search?search=${inventoryItems[0].name}`,
                            {
                                headers: {
                                    Cookie: loggedInCookieAdmin,
                                },
                            }
                        )
                    );

                    const $ = cheerio.load(
                        await searchInventoryItemResponse.text()
                    );
                    expect($.text()).toInclude(
                        "No inventory items match search criteria"
                    );
                });

                test("Results found using post update value as search term", async () => {
                    const searchInventoryItemResponse = await app.handle(
                        new Request(
                            `${baseUrl}/inventory/list/search?search=${changeInventoryNameTo}`,
                            {
                                headers: {
                                    Cookie: loggedInCookieAdmin,
                                },
                            }
                        )
                    );

                    const $ = cheerio.load(
                        await searchInventoryItemResponse.text()
                    );
                    const rows = $("tbody tr");

                    expect(rows.length).toBe(1);
                    expect(rows.first().text()).toContain(
                        changeInventoryNameTo.toUpperCase()
                    );
                });

                describe("HTMX markup response", async () => {
                    const responseText = await editInventoryItemResponse.text();
                    test("No htmx markup, but updated confirm", () => {
                        expect(responseText).toBe("Updated");
                    });
                });
            });
        });
    });
});
